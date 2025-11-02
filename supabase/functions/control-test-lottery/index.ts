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
    const { adminWallet, lotteryType, action, durationMinutes } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const { data: hasAdminRole } = await supabaseClient.rpc('has_role', {
      _wallet: adminWallet,
      _role: 'admin',
    });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if test mode is enabled
    const { data: testModeState } = await supabaseClient
      .from('test_mode_state')
      .select('is_enabled')
      .single();

    if (!testModeState?.is_enabled) {
      return new Response(
        JSON.stringify({ error: 'Test mode is not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'start') {
      // Create or update test lottery run
      const { data: existingRun } = await supabaseClient
        .from('test_lottery_runs')
        .select('*')
        .eq('lottery_type', lotteryType)
        .eq('status', 'RUNNING')
        .single();

      if (existingRun) {
        return new Response(
          JSON.stringify({ error: 'Test lottery is already running' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newRun, error: insertError } = await supabaseClient
        .from('test_lottery_runs')
        .insert({
          lottery_type: lotteryType,
          status: 'RUNNING',
          started_at: new Date().toISOString(),
          duration_minutes: durationMinutes || 5,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log audit
      await supabaseClient.from('audit_log').insert({
        action_type: 'START_TEST_LOTTERY',
        action_details: { lotteryType, durationMinutes: durationMinutes || 5 },
        admin_wallet: adminWallet,
      });

      return new Response(
        JSON.stringify({ success: true, run: newRun }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'stop') {
      // Update test lottery run to stopped
      const { error: updateError } = await supabaseClient
        .from('test_lottery_runs')
        .update({
          status: 'STOPPED',
          stopped_at: new Date().toISOString(),
        })
        .eq('lottery_type', lotteryType)
        .eq('status', 'RUNNING');

      if (updateError) throw updateError;

      // Log audit
      await supabaseClient.from('audit_log').insert({
        action_type: 'STOP_TEST_LOTTERY',
        action_details: { lotteryType },
        admin_wallet: adminWallet,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error controlling test lottery:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});