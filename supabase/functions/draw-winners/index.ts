import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } from "https://esm.sh/@solana/web3.js@1.87.6";
import bs58 from "https://esm.sh/bs58@5.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOLANA_NETWORK = 'https://api.devnet.solana.com';

// Wallet configurations
const LOTTERY_WALLETS = {
  monthly: {
    publicKey: 'FfVVCDEoigroHR49zLxS3C3WuWQDzT6Mujidd73bDfcM',
    privateKeyEnv: 'MONTHLY_LOTTERY_PRIVATE_KEY'
  },
  weekly: {
    publicKey: 'EAcYYNgT3BexVLpjnAwDawd75VXvjcAeCf37bXK4f7Zp',
    privateKeyEnv: 'WEEKLY_LOTTERY_PRIVATE_KEY'
  },
  daily: {
    publicKey: 'Bt75Ar8C3U5cPVhWmXj8CTF1AG858DsYntqMbAwQhRqj',
    privateKeyEnv: 'DAILY_LOTTERY_PRIVATE_KEY'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== DRAW-WINNERS FUNCTION STARTED ===');
    
    const { drawId } = await req.json();
    
    if (!drawId) {
      return new Response(
        JSON.stringify({ error: 'Draw ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get draw info
    const { data: draw, error: drawError } = await supabase
      .from('lottery_draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (drawError || !draw) {
      throw new Error('Draw not found');
    }

    console.log(`📊 Processing ${draw.lottery_type} lottery draw`);

    // Get all tickets for this draw
    const { data: tickets, error: ticketsError } = await supabase
      .from('lottery_tickets')
      .select('*')
      .eq('draw_id', drawId);

    if (ticketsError || !tickets || tickets.length === 0) {
      throw new Error('No tickets found for this draw');
    }

    console.log(`🎫 Found ${tickets.length} tickets`);

    // Calculate prize pool (70% of total pool)
    const prizePoolLamports = Math.floor(draw.total_pool_lamports * 0.7);
    console.log(`💰 Prize pool: ${prizePoolLamports} lamports`);

    // Select winners based on lottery type
    const winners = [];
    
    // Shuffle tickets for random selection
    const shuffled = [...tickets].sort(() => Math.random() - 0.5);

    if (draw.lottery_type === 'monthly') {
      // 60% jackpot, 5% second, 5% split among 100 random
      if (shuffled.length > 0) {
        winners.push({
          ticket_id: shuffled[0].id,
          wallet_address: shuffled[0].wallet_address,
          prize_tier: 'jackpot',
          prize_lamports: Math.floor(prizePoolLamports * 0.6)
        });
      }
      if (shuffled.length > 1) {
        winners.push({
          ticket_id: shuffled[1].id,
          wallet_address: shuffled[1].wallet_address,
          prize_tier: 'second',
          prize_lamports: Math.floor(prizePoolLamports * 0.05)
        });
      }
      
      // 100 random winners split 5%
      const randomCount = Math.min(100, shuffled.length - 2);
      const randomPrize = Math.floor(prizePoolLamports * 0.05 / randomCount);
      for (let i = 2; i < 2 + randomCount; i++) {
        winners.push({
          ticket_id: shuffled[i].id,
          wallet_address: shuffled[i].wallet_address,
          prize_tier: 'random',
          prize_lamports: randomPrize
        });
      }
    } else if (draw.lottery_type === 'weekly') {
      // 65% main, 5% runner-up
      if (shuffled.length > 0) {
        winners.push({
          ticket_id: shuffled[0].id,
          wallet_address: shuffled[0].wallet_address,
          prize_tier: 'main',
          prize_lamports: Math.floor(prizePoolLamports * 0.65)
        });
      }
      if (shuffled.length > 1) {
        winners.push({
          ticket_id: shuffled[1].id,
          wallet_address: shuffled[1].wallet_address,
          prize_tier: 'runner-up',
          prize_lamports: Math.floor(prizePoolLamports * 0.05)
        });
      }
    } else if (draw.lottery_type === 'daily') {
      // 70% single winner
      if (shuffled.length > 0) {
        winners.push({
          ticket_id: shuffled[0].id,
          wallet_address: shuffled[0].wallet_address,
          prize_tier: 'winner',
          prize_lamports: prizePoolLamports
        });
      }
    }

    console.log(`🏆 Selected ${winners.length} winners`);

    // Save winners to database
    const { error: winnersError } = await supabase
      .from('lottery_winners')
      .insert(
        winners.map(w => ({
          ...w,
          draw_id: drawId
        }))
      );

    if (winnersError) {
      console.error('Error saving winners:', winnersError);
      throw winnersError;
    }

    // Update draw status
    await supabase
      .from('lottery_draws')
      .update({ status: 'completed' })
      .eq('id', drawId);

    console.log('✅ Winners selected and saved');

    // Payout winners automatically
    console.log('💸 Initiating payouts...');
    const connection = new Connection(SOLANA_NETWORK, 'confirmed');
    const walletConfig = LOTTERY_WALLETS[draw.lottery_type as keyof typeof LOTTERY_WALLETS];
    const privateKey = Deno.env.get(walletConfig.privateKeyEnv);
    
    if (!privateKey) {
      throw new Error(`Private key not configured for ${draw.lottery_type} lottery`);
    }

    const fromKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    for (const winner of winners) {
      try {
        const toPublicKey = new PublicKey(winner.wallet_address);
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toPublicKey,
            lamports: BigInt(winner.prize_lamports),
          })
        );

        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [fromKeypair]
        );

        // Update winner with transaction signature
        await supabase
          .from('lottery_winners')
          .update({
            transaction_signature: signature,
            paid_at: new Date().toISOString()
          })
          .eq('draw_id', drawId)
          .eq('wallet_address', winner.wallet_address);

        console.log(`✅ Paid ${winner.wallet_address}: ${signature}`);
      } catch (error) {
        console.error(`❌ Failed to pay ${winner.wallet_address}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        winners: winners.length,
        message: 'Winners drawn and payouts processed'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error drawing winners:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});