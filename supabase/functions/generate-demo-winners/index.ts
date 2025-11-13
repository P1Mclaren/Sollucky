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

function getPrizeForType(lotteryType: string): number {
  // Returns lamports
  const prizes = {
    monthly: 100 * 1000000000, // 100 SOL
    weekly: 20 * 1000000000,   // 20 SOL
    daily: 3 * 1000000000      // 3 SOL
  };
  return prizes[lotteryType as keyof typeof prizes] || 1000000000;
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

    // Parse request body for lottery type
    const body = await req.json().catch(() => ({}));
    const lotteryType = body.lotteryType || LOTTERY_TYPES[Math.floor(Math.random() * LOTTERY_TYPES.length)];

    // Generate 1 jackpot winner
    const winner = {
      wallet_address: generateRandomWallet(),
      prize_lamports: getPrizeForType(lotteryType),
      prize_tier: 'jackpot',
      lottery_type: lotteryType,
      show_on_wall_of_fame: true,
    };

    // Insert demo winner
    const { error: insertError } = await supabaseClient
      .from('demo_winners')
      .insert([winner]);

    if (insertError) {
      console.error('Error inserting demo winner:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to generate demo winner' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generated demo winner for ${lotteryType} lottery`);

    return new Response(
      JSON.stringify({ success: true, winner }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-demo-winners:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});