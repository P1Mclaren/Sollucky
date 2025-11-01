import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_WALLET = "HJJEjQRRzCkx7B9j8JABQjTxn7dDCnMdZLnynDLN3if5";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress } = await req.json();

    // Verify admin wallet
    if (walletAddress !== ADMIN_WALLET) {
      console.log('Unauthorized admin access attempt from:', walletAddress);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to fetch admin data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
