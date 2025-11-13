import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get wallet address from user metadata
    const adminWallet = user.user_metadata?.wallet_address;
    
    if (!adminWallet) {
      return new Response(JSON.stringify({ error: 'Unauthorized - No wallet address' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _wallet: adminWallet,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { enabled } = await req.json();

    // Get the demo mode state ID
    const { data: demoState } = await supabaseClient
      .from('demo_mode_state')
      .select('id')
      .single();

    if (!demoState) {
      return new Response(JSON.stringify({ error: 'Demo mode state not initialized' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update demo mode state
    const { error: updateError } = await supabaseClient
      .from('demo_mode_state')
      .update({
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
        updated_by: adminWallet
      })
      .eq('id', demoState.id);

    if (updateError) {
      console.error('Error updating demo mode:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update demo mode' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Demo mode ${enabled ? 'enabled' : 'disabled'} by ${adminWallet}`);

    return new Response(
      JSON.stringify({ success: true, enabled }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in toggle-demo-mode:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});