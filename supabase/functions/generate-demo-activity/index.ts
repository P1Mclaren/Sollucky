import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOTTERY_TYPES = ['monthly', 'weekly', 'daily'];

function generateRandomWallet(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let wallet = '';
  for (let i = 0; i < 44; i++) {
    wallet += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return wallet;
}

function getRandomTicketCount(): number {
  const rand = Math.random();
  if (rand < 0.5) return 1;
  if (rand < 0.8) return Math.floor(Math.random() * 5) + 2;
  if (rand < 0.95) return Math.floor(Math.random() * 10) + 5;
  return Math.floor(Math.random() * 50) + 10;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if demo mode is enabled
    const { data: demoModeState } = await supabaseClient
      .from('demo_mode_state')
      .select('is_enabled')
      .single();

    if (!demoModeState?.is_enabled) {
      return new Response(
        JSON.stringify({ message: 'Demo mode is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 2-5 random ticket purchases
    const numPurchases = Math.floor(Math.random() * 4) + 2;
    const transactions = [];

    for (let i = 0; i < numPurchases; i++) {
      const lotteryType = LOTTERY_TYPES[Math.floor(Math.random() * LOTTERY_TYPES.length)];
      const ticketCount = getRandomTicketCount();
      
      transactions.push({
        wallet_address: generateRandomWallet(),
        ticket_count: ticketCount,
        lottery_type: lotteryType,
      });
    }

    // Insert demo transactions
    const { error: insertError } = await supabaseClient
      .from('demo_transactions')
      .insert(transactions);

    if (insertError) {
      console.error('Error inserting demo transactions:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to generate demo activity' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update prize pools for active draws
    for (const lotteryType of LOTTERY_TYPES) {
      const { data: activeDraw } = await supabaseClient
        .from('lottery_draws')
        .select('id, total_pool_lamports')
        .eq('lottery_type', lotteryType)
        .eq('status', 'active')
        .single();

      if (activeDraw) {
        // Add simulated pool increase (0.05 to 0.5 SOL)
        const increaseAmount = Math.floor((Math.random() * 450000000) + 50000000);
        
        await supabaseClient
          .from('lottery_draws')
          .update({
            total_pool_lamports: (activeDraw.total_pool_lamports || 0) + increaseAmount,
            total_tickets_sold: (await supabaseClient
              .from('demo_transactions')
              .select('ticket_count')
              .eq('lottery_type', lotteryType)).data?.reduce((sum, t) => sum + t.ticket_count, 0) || 0
          })
          .eq('id', activeDraw.id);
      }
    }

    console.log(`Generated ${numPurchases} demo transactions`);

    return new Response(
      JSON.stringify({ success: true, generated: numPurchases }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-demo-activity:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});