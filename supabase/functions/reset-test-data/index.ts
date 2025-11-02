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
    // Extract wallet address from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminWallet = user.user_metadata?.wallet_address;
    if (!adminWallet) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No wallet address' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Reset test lottery runs
    await supabaseClient
      .from('test_lottery_runs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Log audit
    await supabaseClient.from('audit_log').insert({
      action_type: 'RESET_TEST_DATA',
      action_details: { message: 'All test data has been reset' },
      admin_wallet: adminWallet,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Test data reset successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error resetting test data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});