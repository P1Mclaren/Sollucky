import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from "https://esm.sh/@solana/web3.js@1.87.6";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@5.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MINIMUM_WITHDRAWAL_LAMPORTS = 50000000; // ~$10 worth of SOL (0.05 SOL at ~$200/SOL)
const SOLANA_NETWORK = 'https://api.mainnet-beta.solana.com';

serve(async (req) => {
  console.log('=== PROCESS-WITHDRAWAL FUNCTION STARTED ===');
  console.log(`Request method: ${req.method}`);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, amountLamports, signature, message } = await req.json();
    console.log('📝 Withdrawal request:', { walletAddress, amountLamports });

    console.log('🔍 Validating required fields...');
    if (!walletAddress || !amountLamports || !signature || !message) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields (walletAddress, amountLamports, signature, message)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Required fields present');

    // Fix Issue #2: Verify wallet signature to prove ownership
    console.log('🔐 Verifying wallet signature...');
    try {
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );
      
      if (!isValid) {
        console.error('❌ Invalid signature for withdrawal request:', walletAddress);
        return new Response(
          JSON.stringify({ error: 'Invalid wallet signature - you must prove wallet ownership' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verify message content and timestamp
      const messageData = JSON.parse(message);
      if (messageData.action !== 'withdraw' || messageData.wallet !== walletAddress) {
        return new Response(
          JSON.stringify({ error: 'Invalid message content' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check timestamp - must be within 5 minutes
      const timeDiff = Date.now() - messageData.timestamp;
      if (timeDiff > 300000 || timeDiff < 0) {
        return new Response(
          JSON.stringify({ error: 'Signature expired or invalid timestamp - please try again' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ Wallet signature verified');
    } catch (verifyError) {
      console.error('❌ Signature verification error:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify wallet signature' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔌 Initializing Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check minimum withdrawal amount
    console.log('🔍 Checking minimum withdrawal amount...');
    if (amountLamports < MINIMUM_WITHDRAWAL_LAMPORTS) {
      console.error('❌ Amount below minimum:', amountLamports);
      return new Response(
        JSON.stringify({ error: 'Minimum withdrawal is $10' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Amount meets minimum requirement');

    // Get user's earnings
    console.log('💰 Fetching user earnings...');
    const { data: earnings, error: earningsError } = await supabase
      .from('referral_earnings')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (earningsError || !earnings) {
      console.error('❌ No earnings found for wallet:', walletAddress);
      return new Response(
        JSON.stringify({ error: 'No earnings found for this wallet' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Earnings found - Pending: ${earnings.pending_lamports} lamports`);

    // Check if user has enough pending balance
    console.log('🔍 Checking sufficient balance...');
    if (BigInt(earnings.pending_lamports) < BigInt(amountLamports)) {
      console.error('❌ Insufficient balance:', {
        pending: earnings.pending_lamports,
        requested: amountLamports
      });
      return new Response(
        JSON.stringify({ error: 'Insufficient pending balance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Sufficient balance confirmed');

    // Get lottery wallet private key
    console.log('🔑 Loading lottery wallet credentials...');
    const lotteryPrivateKey = Deno.env.get('LOTTERY_WALLET_PRIVATE_KEY');
    if (!lotteryPrivateKey) {
      console.error('❌ LOTTERY_WALLET_PRIVATE_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Withdrawal system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Wallet credentials loaded');
    console.log('🚀 Initiating instant SOL transfer...');

    // Initialize Solana connection and lottery wallet
    console.log('🔗 Connecting to Solana network...');
    const connection = new Connection(SOLANA_NETWORK, 'confirmed');
    const fromKeypair = Keypair.fromSecretKey(bs58.decode(lotteryPrivateKey));
    const toPublicKey = new PublicKey(walletAddress);

    console.log(`💸 Sending ${amountLamports} lamports`);
    console.log(`   From: ${fromKeypair.publicKey.toString()}`);
    console.log(`   To: ${walletAddress}`);

    let txSignature: string;
    
    try {
      console.log('📝 Creating Solana transaction...');
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      // Create transaction
      const transaction = new Transaction({
        feePayer: fromKeypair.publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPublicKey,
          lamports: BigInt(amountLamports),
        })
      );

      console.log('✍️ Signing transaction...');
      transaction.sign(fromKeypair);

      console.log('📤 Sending transaction...');
      txSignature = await connection.sendRawTransaction(transaction.serialize());

      console.log(`✅ Transaction sent!`);
      console.log(`   Signature: ${txSignature}`);
      console.log('⏳ Confirming transaction...');

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log(`✅ Transaction confirmed!`);
    } catch (txError) {
      console.error('❌ Transaction failed:', txError);
      console.error('   Error details:', txError instanceof Error ? txError.message : 'Unknown error');
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SOL. Please try again or contact support.',
          details: txError instanceof Error ? txError.message : 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create withdrawal record with completed status
    console.log('💾 Recording withdrawal in database...');
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        wallet_address: walletAddress,
        amount_lamports: amountLamports,
        status: 'completed',
        transaction_signature: txSignature,
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('⚠️ Error creating withdrawal record (but SOL was sent!):', withdrawalError);
      // Don't return error since SOL was already sent
    } else {
      console.log('✅ Withdrawal record created:', withdrawal.id);
    }

    // Update earnings
    console.log('📊 Updating earnings records...');
    const newPendingLamports = BigInt(earnings.pending_lamports) - BigInt(amountLamports);
    const newWithdrawnLamports = BigInt(earnings.withdrawn_lamports) + BigInt(amountLamports);
    
    const { error: updateError } = await supabase
      .from('referral_earnings')
      .update({
        pending_lamports: newPendingLamports.toString(),
        withdrawn_lamports: newWithdrawnLamports.toString()
      })
      .eq('wallet_address', walletAddress);

    if (updateError) {
      console.error('⚠️ Error updating earnings (but SOL was sent!):', updateError);
      // Don't return error since SOL was already sent
    } else {
      console.log('✅ Earnings updated successfully');
      console.log(`   New pending: ${newPendingLamports}`);
      console.log(`   New withdrawn: ${newWithdrawnLamports}`);
    }

    console.log('🎉 Withdrawal completed successfully!');
    console.log(`   Transaction: ${txSignature}`);
    console.log(`   Wallet: ${walletAddress}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionSignature: txSignature,
        withdrawalId: withdrawal?.id,
        message: 'SOL sent successfully! Check your wallet.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
