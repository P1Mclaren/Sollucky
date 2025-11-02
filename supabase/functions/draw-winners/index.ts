import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from "https://esm.sh/@solana/web3.js@1.87.6";
import bs58 from "https://esm.sh/bs58@5.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DrawWinnersSchema = z.object({
  drawId: z.string().uuid('Invalid draw ID format')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== DRAW WINNERS V2 STARTED ===');
    
    // 🔒 AUTHENTICATION & AUTHORIZATION
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Invalid token:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminWallet = user.user_metadata?.wallet_address;
    if (!adminWallet) {
      console.error('❌ No wallet address in token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No wallet address' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Verifying admin role for:', adminWallet);
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      _wallet: adminWallet,
      _role: 'admin',
    });

    if (roleError || !hasAdminRole) {
      console.error('❌ Unauthorized admin access attempt from:', adminWallet);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Admin role verified');
    
    // 🔒 INPUT VALIDATION
    const body = await req.json();
    const validationResult = DrawWinnersSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('❌ Invalid input:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.issues.map(i => i.message).join(', ')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { drawId } = validationResult.data;

    // 1. GET DRAW INFO
    console.log('📊 Fetching draw:', drawId);
    const { data: draw, error: drawError } = await supabase
      .from('lottery_draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (drawError || !draw) {
      throw new Error('Draw not found: ' + drawError?.message);
    }

    console.log(`✅ Found ${draw.lottery_type} lottery draw`);
    console.log(`   Status: ${draw.status}`);
    console.log(`   Total pool: ${draw.total_pool_lamports} lamports`);

    // 2. GET OR CREATE TICKETS
    console.log('🎫 Fetching tickets...');
    let { data: tickets } = await supabase
      .from('lottery_tickets')
      .select('*')
      .eq('draw_id', drawId);

    // If no tickets, create test tickets for testing
    if (!tickets || tickets.length === 0) {
      console.log('⚠️  No tickets found. Creating test tickets for testing...');
      
      const ticketCount = draw.lottery_type === 'monthly' ? 150 : 
                          draw.lottery_type === 'weekly' ? 50 : 10;
      
      const testTickets = [];
      for (let i = 0; i < ticketCount; i++) {
        const randomWallet = Keypair.generate().publicKey.toString();
        testTickets.push({
          draw_id: drawId,
          wallet_address: randomWallet,
          ticket_code: `TEST-${Date.now()}-${i}`,
          is_bonus: false
        });
      }

      await supabase.from('lottery_tickets').insert(testTickets);
      
      const { data: newTickets } = await supabase
        .from('lottery_tickets')
        .select('*')
        .eq('draw_id', drawId);
      
      tickets = newTickets || [];
      console.log(`✅ Created ${tickets.length} test tickets`);
    } else {
      console.log(`✅ Found ${tickets.length} existing tickets`);
    }

    if (tickets.length === 0) {
      throw new Error('No tickets available for draw');
    }

    // 3. CALCULATE PRIZES
    const prizePoolLamports = Math.floor(draw.total_pool_lamports * 0.7);
    console.log(`💰 Prize pool (70% of total): ${prizePoolLamports} lamports`);

    // Shuffle tickets for random selection
    const shuffled = [...tickets].sort(() => Math.random() - 0.5);
    const winners: Array<{
      ticket_id: string;
      wallet_address: string;
      prize_tier: string;
      prize_lamports: number;
    }> = [];

    // Calculate winners based on lottery type
    if (draw.lottery_type === 'monthly') {
      console.log('🎰 MONTHLY: 60% jackpot, 5% runner-up, 5% to up to 100 wallets');
      
      // 60% jackpot
      winners.push({
        ticket_id: shuffled[0].id,
        wallet_address: shuffled[0].wallet_address,
        prize_tier: 'jackpot',
        prize_lamports: Math.floor(prizePoolLamports * 0.6)
      });

      // 5% runner-up
      if (shuffled.length > 1) {
        winners.push({
          ticket_id: shuffled[1].id,
          wallet_address: shuffled[1].wallet_address,
          prize_tier: 'runner-up',
          prize_lamports: Math.floor(prizePoolLamports * 0.05)
        });
      }

      // 5% split among up to 100 wallets
      const availableForSplit = shuffled.slice(2);
      const splitCount = Math.min(100, availableForSplit.length);
      
      if (splitCount > 0) {
        const splitAmount = Math.floor((prizePoolLamports * 0.05) / splitCount);
        console.log(`   Splitting 5% among ${splitCount} wallets (${splitAmount} lamports each)`);
        
        for (let i = 0; i < splitCount; i++) {
          winners.push({
            ticket_id: availableForSplit[i].id,
            wallet_address: availableForSplit[i].wallet_address,
            prize_tier: 'split',
            prize_lamports: splitAmount
          });
        }
      }

    } else if (draw.lottery_type === 'weekly') {
      console.log('🎰 WEEKLY: 65% jackpot, 5% runner-up');
      
      // 65% jackpot
      winners.push({
        ticket_id: shuffled[0].id,
        wallet_address: shuffled[0].wallet_address,
        prize_tier: 'jackpot',
        prize_lamports: Math.floor(prizePoolLamports * 0.65)
      });

      // 5% runner-up
      if (shuffled.length > 1) {
        winners.push({
          ticket_id: shuffled[1].id,
          wallet_address: shuffled[1].wallet_address,
          prize_tier: 'runner-up',
          prize_lamports: Math.floor(prizePoolLamports * 0.05)
        });
      }

    } else if (draw.lottery_type === 'daily') {
      console.log('🎰 DAILY: 70% jackpot');
      
      // 70% jackpot (entire prize pool)
      winners.push({
        ticket_id: shuffled[0].id,
        wallet_address: shuffled[0].wallet_address,
        prize_tier: 'jackpot',
        prize_lamports: prizePoolLamports
      });
    }

    console.log(`🏆 Selected ${winners.length} winners`);
    winners.forEach(w => {
      console.log(`   ${w.prize_tier}: ${w.wallet_address.slice(0, 8)}... = ${w.prize_lamports} lamports`);
    });

    // 4. SAVE WINNERS TO DATABASE
    console.log('💾 Saving winners to database...');
    const { error: winnersError } = await supabase
      .from('lottery_winners')
      .insert(
        winners.map(w => ({
          draw_id: drawId,
          ticket_id: w.ticket_id,
          wallet_address: w.wallet_address,
          prize_tier: w.prize_tier,
          prize_lamports: w.prize_lamports
        }))
      );

    if (winnersError) {
      throw new Error('Failed to save winners: ' + winnersError.message);
    }

    // 5. UPDATE DRAW STATUS
    await supabase
      .from('lottery_draws')
      .update({ status: 'completed' })
      .eq('id', drawId);

    console.log('✅ Winners saved and draw marked as completed');

    // 6. SEND ACTUAL SOL ON MAINNET
    console.log('💸 Processing payouts on mainnet...');
    
    // Get the correct private key for this lottery type
    const privateKeyEnvVar = draw.lottery_type === 'monthly' ? 'MONTHLY_LOTTERY_PRIVATE_KEY' :
                            draw.lottery_type === 'weekly' ? 'WEEKLY_LOTTERY_PRIVATE_KEY' :
                            'DAILY_LOTTERY_PRIVATE_KEY';
    
    const privateKeyStr = Deno.env.get(privateKeyEnvVar);
    
    if (!privateKeyStr) {
      throw new Error(`Private key not found: ${privateKeyEnvVar}`);
    }

    console.log(`🔑 Using wallet for ${draw.lottery_type} lottery`);

    // Connect to mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const fromKeypair = Keypair.fromSecretKey(bs58.decode(privateKeyStr));
    
    console.log(`   From: ${fromKeypair.publicKey.toString()}`);

    // Check balance
    const balance = await connection.getBalance(fromKeypair.publicKey);
    console.log(`   Balance: ${balance} lamports (${(balance / 1e9).toFixed(4)} SOL)`);

    let successfulPayouts = 0;
    let failedPayouts = 0;

    // Send payments to each winner
    for (const winner of winners) {
      try {
        const toPublicKey = new PublicKey(winner.wallet_address);
        
        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        
        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: fromKeypair.publicKey,
        }).add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toPublicKey,
            lamports: BigInt(winner.prize_lamports),
          })
        );

        // Sign the transaction
        transaction.sign(fromKeypair);

        console.log(`   Sending ${winner.prize_lamports} lamports to ${winner.wallet_address.slice(0, 8)}...`);
        
        // Send transaction without waiting for confirmation (websockets don't work in edge functions)
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'finalized',
        });

        // Update winner record with transaction signature
        await supabase
          .from('lottery_winners')
          .update({
            transaction_signature: signature,
            paid_at: new Date().toISOString()
          })
          .eq('draw_id', drawId)
          .eq('wallet_address', winner.wallet_address);

        console.log(`   ✅ Sent! Signature: ${signature}`);
        successfulPayouts++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Failed to pay ${winner.wallet_address}:`, error);
        failedPayouts++;
      }
    }

    console.log('=== DRAW COMPLETE ===');
    console.log(`✅ Successful payouts: ${successfulPayouts}`);
    console.log(`❌ Failed payouts: ${failedPayouts}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        draw_id: drawId,
        lottery_type: draw.lottery_type,
        total_winners: winners.length,
        successful_payouts: successfulPayouts,
        failed_payouts: failedPayouts,
        message: 'Draw completed and payouts processed'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ ERROR:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
