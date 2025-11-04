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

    console.log('🔍 Checking for lotteries to activate...');

    // Launch time: November 12, 2025 at 6 PM CET (17:00 UTC)
    const launchTime = new Date('2025-11-12T17:00:00Z');
    const now = new Date();

    if (now < launchTime) {
      return new Response(
        JSON.stringify({
          message: 'Not yet launch time',
          launch_time: launchTime.toISOString(),
          current_time: now.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Activate all pre-order draws
    const { data, error } = await supabase
      .from('lottery_draws')
      .update({ status: 'active' })
      .eq('status', 'pre-order')
      .select();

    if (error) {
      console.error('Error activating lotteries:', error);
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`✅ Activated ${data.length} lotteries`);
    }

    return new Response(
      JSON.stringify({
        message: 'Lotteries activated',
        activated_count: data?.length || 0,
        activated_draws: data
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
