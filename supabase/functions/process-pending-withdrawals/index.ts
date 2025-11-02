import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } from 'https://esm.sh/@solana/web3.js@1.87.6';
import bs58 from 'https://esm.sh/bs58@5.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOLANA_NETWORK = 'https://mainnet.helius-rpc.com/?api-key=28a67cf7-a73e-4a20-b834-086145db006f';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing pending withdrawals request received');

    // Extract wallet address from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.error('Invalid token:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminWallet = user.user_metadata?.wallet_address;
    if (!adminWallet) {
      console.error('No wallet address in token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No wallet address' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin wallet: ${adminWallet}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    console.log('Verifying admin role...');
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc('has_role', { _wallet: adminWallet, _role: 'admin' });

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!hasAdminRole) {
      console.error('Unauthorized: User is not admin');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified, fetching pending withdrawals...');

    // Get pending withdrawals
    const { data: pendingWithdrawals, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching withdrawals:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending withdrawals' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
      console.log('No pending withdrawals found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0,
          message: 'No pending withdrawals to process' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingWithdrawals.length} pending withdrawal(s)`);

    // Get lottery wallet private key from environment
    const lotteryPrivateKey = Deno.env.get('LOTTERY_WALLET_PRIVATE_KEY');
    if (!lotteryPrivateKey) {
      console.error('LOTTERY_WALLET_PRIVATE_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing wallet private key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Solana connection
    const connection = new Connection(SOLANA_NETWORK, 'confirmed');
    const fromKeypair = Keypair.fromSecretKey(bs58.decode(lotteryPrivateKey));

    console.log(`Lottery wallet: ${fromKeypair.publicKey.toString()}`);

    const processed = [];
    const failed = [];

    // Process each withdrawal
    for (const withdrawal of pendingWithdrawals) {
      try {
        console.log(`Processing withdrawal ${withdrawal.id} for ${withdrawal.wallet_address}`);
        console.log(`Amount: ${withdrawal.amount_lamports} lamports`);

        const toPublicKey = new PublicKey(withdrawal.wallet_address);

        // Create transaction
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toPublicKey,
            lamports: BigInt(withdrawal.amount_lamports),
          })
        );

        // Send transaction
        console.log('Sending transaction...');
        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [fromKeypair]
        );

        console.log(`Transaction successful: ${signature}`);

        // Update withdrawal status
        const { error: updateError } = await supabase
          .from('withdrawal_requests')
          .update({
            status: 'completed',
            transaction_signature: signature,
            processed_at: new Date().toISOString()
          })
          .eq('id', withdrawal.id);

        if (updateError) {
          console.error(`Failed to update withdrawal ${withdrawal.id}:`, updateError);
          failed.push({
            id: withdrawal.id,
            wallet: withdrawal.wallet_address,
            error: 'Database update failed (transaction succeeded)',
            signature
          });
          continue;
        }

        // Update referral earnings
        const { error: earningsError } = await supabase
          .from('referral_earnings')
          .update({
            withdrawn_lamports: supabase.rpc('increment', { 
              column: 'withdrawn_lamports',
              amount: withdrawal.amount_lamports 
            }),
            pending_lamports: supabase.rpc('decrement', { 
              column: 'pending_lamports',
              amount: withdrawal.amount_lamports 
            })
          })
          .eq('wallet_address', withdrawal.wallet_address);

        // Note: earnings update failure is not critical since transaction succeeded
        if (earningsError) {
          console.error(`Warning: Failed to update earnings for ${withdrawal.wallet_address}:`, earningsError);
        }

        processed.push({
          id: withdrawal.id,
          wallet: withdrawal.wallet_address,
          amount: withdrawal.amount_lamports,
          signature
        });

        console.log(`✓ Successfully processed withdrawal ${withdrawal.id}`);

      } catch (error) {
        console.error(`Error processing withdrawal ${withdrawal.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Mark as failed in database
        await supabase
          .from('withdrawal_requests')
          .update({
            status: 'failed',
            processed_at: new Date().toISOString()
          })
          .eq('id', withdrawal.id);

        failed.push({
          id: withdrawal.id,
          wallet: withdrawal.wallet_address,
          error: errorMessage
        });
      }
    }

    console.log(`Withdrawal processing complete: ${processed.length} succeeded, ${failed.length} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processed.length,
        failed: failed.length,
        details: {
          processed,
          failed
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-pending-withdrawals:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
