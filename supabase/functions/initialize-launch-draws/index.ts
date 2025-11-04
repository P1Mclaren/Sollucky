import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Initializing launch draws...');

    // Launch date: November 12, 2025 at 6 PM CET (17:00 UTC)
    // All lotteries start in pre-order and switch to active after launch

    // Monthly Lottery
    // Starts: November 12, 2025 18:00 CET
    // Ends: December 23, 2025 23:59 CET
    // First Draw: December 24, 2025 18:00 CET
    const monthlyStart = new Date('2025-11-12T17:00:00Z');
    const monthlyEnd = new Date('2025-12-23T22:59:59Z');
    const monthlyDraw = new Date('2025-12-24T17:00:00Z');

    // Weekly Lottery
    // Starts: November 12, 2025 18:00 CET
    // Ends: November 18, 2025 23:59 CET
    // First Draw: November 19, 2025 18:00 CET
    const weeklyStart = new Date('2025-11-12T17:00:00Z');
    const weeklyEnd = new Date('2025-11-18T22:59:59Z');
    const weeklyDraw = new Date('2025-11-19T17:00:00Z');

    // Daily Lottery
    // Starts: November 12, 2025 18:00 CET
    // Ends: November 12, 2025 23:59 CET
    // First Draw: November 13, 2025 18:00 CET
    const dailyStart = new Date('2025-11-12T17:00:00Z');
    const dailyEnd = new Date('2025-11-12T22:59:59Z');
    const dailyDraw = new Date('2025-11-13T17:00:00Z');

    const draws = [
      {
        lottery_type: 'monthly',
        status: 'pre-order',
        start_date: monthlyStart.toISOString(),
        end_date: monthlyEnd.toISOString(),
        draw_date: monthlyDraw.toISOString(),
        total_pool_lamports: 0,
        jackpot_lamports: 0,
        total_tickets_sold: 0
      },
      {
        lottery_type: 'weekly',
        status: 'pre-order',
        start_date: weeklyStart.toISOString(),
        end_date: weeklyEnd.toISOString(),
        draw_date: weeklyDraw.toISOString(),
        total_pool_lamports: 0,
        jackpot_lamports: 0,
        total_tickets_sold: 0
      },
      {
        lottery_type: 'daily',
        status: 'pre-order',
        start_date: dailyStart.toISOString(),
        end_date: dailyEnd.toISOString(),
        draw_date: dailyDraw.toISOString(),
        total_pool_lamports: 0,
        jackpot_lamports: 0,
        total_tickets_sold: 0
      }
    ];

    // Delete existing draws and insert new ones
    await supabase.from('lottery_draws').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { data, error } = await supabase
      .from('lottery_draws')
      .insert(draws)
      .select();

    if (error) {
      console.error('Error creating draws:', error);
      throw error;
    }

    console.log('✅ Launch draws initialized successfully');

    return new Response(
      JSON.stringify({
        message: 'Launch draws initialized',
        draws: data,
        launch_date: '2025-11-12T17:00:00Z',
        note: 'All draws start in pre-order mode and will automatically switch to active after launch'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
