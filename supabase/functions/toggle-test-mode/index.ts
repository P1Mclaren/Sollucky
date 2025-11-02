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
    const { adminWallet, isEnabled } = await req.json();

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

    // Update test mode state
    const { error: updateError } = await supabaseClient
      .from('test_mode_state')
      .update({
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
        updated_by: adminWallet,
      })
      .eq('id', (await supabaseClient.from('test_mode_state').select('id').single()).data?.id);

    if (updateError) throw updateError;

    // Log audit
    await supabaseClient.from('audit_log').insert({
      action_type: 'TOGGLE_TEST_MODE',
      action_details: { isEnabled },
      admin_wallet: adminWallet,
    });

    return new Response(
      JSON.stringify({ success: true, isEnabled }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error toggling test mode:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});