import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress } = await req.json();

    // Use service role to check admin role and fetch admin data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role using has_role function
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _wallet: walletAddress, _role: 'admin' });

    if (roleError || !isAdmin) {
      console.log('Unauthorized admin access attempt from:', walletAddress);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch fund splits
    const { data: fundSplits, error: fundError } = await supabase
      .from('fund_splits')
      .select('*')
      .order('created_at', { ascending: false });

    if (fundError) {
      console.error('Error fetching fund splits:', fundError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch fund splits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch withdrawal requests
    const { data: withdrawals, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (withdrawalError) {
      console.error('Error fetching withdrawals:', withdrawalError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch withdrawals' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin data accessed by ${walletAddress}`);

    return new Response(
      JSON.stringify({ 
        fundSplits,
        withdrawals
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
