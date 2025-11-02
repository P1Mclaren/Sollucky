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
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Wallet address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create or sign in user with wallet address as identifier
    // Using wallet address as both email (with domain) and in metadata
    const email = `${walletAddress}@wallet.local`;
    const password = Deno.env.get('WALLET_AUTH_SECRET') ?? 'default-secret-change-me';

    // Try to sign in first
    const signInResult = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    let session = signInResult.data.session;
    let user = signInResult.data.user;

    // If sign in fails, create the user
    if (signInResult.error) {
      const signUpResult = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            wallet_address: walletAddress,
          },
        },
      });

      if (signUpResult.error) {
        throw signUpResult.error;
      }

      session = signUpResult.data.session;
      user = signUpResult.data.user;
    }

    // Return the session
    return new Response(
      JSON.stringify({
        session,
        user,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auth-wallet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
