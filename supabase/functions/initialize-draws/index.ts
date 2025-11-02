import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Launch date: November 15, 2025 at 6 PM CET
const LAUNCH_DATE = new Date('2025-11-15T18:00:00+01:00');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== INITIALIZE-DRAWS FUNCTION STARTED ===');
    
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

    // Create initial draws for each lottery type
    const draws = [
      {
        lottery_type: 'monthly',
        start_date: new Date().toISOString(), // Can start pre-ordering immediately
        draw_date: LAUNCH_DATE.toISOString(),
        end_date: new Date(LAUNCH_DATE.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days after launch
        status: new Date() < LAUNCH_DATE ? 'pre-order' : 'active'
      },
      {
        lottery_type: 'weekly',
        start_date: new Date().toISOString(),
        draw_date: LAUNCH_DATE.toISOString(),
        end_date: new Date(LAUNCH_DATE.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days after launch
        status: new Date() < LAUNCH_DATE ? 'pre-order' : 'active'
      },
      {
        lottery_type: 'daily',
        start_date: new Date().toISOString(),
        draw_date: LAUNCH_DATE.toISOString(),
        end_date: new Date(LAUNCH_DATE.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day after launch
        status: new Date() < LAUNCH_DATE ? 'pre-order' : 'active'
      }
    ];

    const { data, error } = await supabase
      .from('lottery_draws')
      .insert(draws)
      .select();

    if (error) {
      console.error('Error creating draws:', error);
      throw error;
    }

    console.log('✅ Successfully created lottery draws:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        draws: data,
        message: 'Lottery draws initialized successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error initializing draws:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});