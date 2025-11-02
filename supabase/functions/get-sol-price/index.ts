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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch SOL price from CoinGecko API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch SOL price');
    }

    const data = await response.json();
    const solPrice = data.solana.usd;

    // Cache the price in database
    await supabase
      .from('sol_price_cache')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001', // Fixed ID for singleton
        price_usd: solPrice,
        updated_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ price_usd: solPrice }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    
    // Try to return cached price if API fails
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: cached } = await supabase
      .from('sol_price_cache')
      .select('price_usd')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return new Response(
        JSON.stringify({ price_usd: cached.price_usd, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to fetch SOL price' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});