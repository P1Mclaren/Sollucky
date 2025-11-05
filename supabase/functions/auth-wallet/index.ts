import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const AuthWalletSchema = z.object({
      walletAddress: z.string()
        .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana wallet address format')
        .min(32, 'Wallet address too short')
        .max(44, 'Wallet address too long')
    });

    const body = await req.json();
    const validationResult = AuthWalletSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.issues.map(i => i.message).join(', ')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { walletAddress } = validationResult.data;

    // Ensure WALLET_AUTH_SECRET is configured
    const password = Deno.env.get('WALLET_AUTH_SECRET');
    if (!password) {
      console.error('CRITICAL: WALLET_AUTH_SECRET is not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create or sign in user with wallet address as identifier
    const email = `${walletAddress}@wallet.local`;

    // Try to sign in first
    const signInResult = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    let session = signInResult.data.session;
    let user = signInResult.data.user;

    // If sign in fails, create the user
    if (signInResult.error) {
      // Check if user exists but can't sign in (e.g., rate limit or confirmation pending)
      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u: any) => u.email === email);
      
      if (existingUser) {
        // User exists, create a session manually using admin API
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
          type: 'magiclink',
          email,
        });
        
        if (sessionError) {
          console.error('Error generating session:', sessionError);
          // Return user without session
          return new Response(
            JSON.stringify({
              session: null,
              user: existingUser,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Sign in with the generated link
        const { data: linkSession } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
        
        session = linkSession.session;
        user = linkSession.user || existingUser;
      } else {
        // Create new user with auto-confirm
        const signUpResult = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              wallet_address: walletAddress,
            },
            emailRedirectTo: undefined,
          },
        });

        if (signUpResult.error) {
          // If it's a rate limit error, try to get existing user info
          if (signUpResult.error.message.includes('For security purposes')) {
            const { data: users } = await supabaseClient.auth.admin.listUsers();
            const foundUser = users?.users?.find((u: any) => u.email === email);
            
            return new Response(
              JSON.stringify({
                session: null,
                user: foundUser || null,
                message: 'Authentication in progress. Please wait a moment and reconnect.',
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw signUpResult.error;
        }

        session = signUpResult.data.session;
        user = signUpResult.data.user;

        // Insert into user_wallets table for secure RLS
        if (user) {
          await supabaseClient
            .from('user_wallets')
            .insert({
              user_id: user.id,
              wallet_address: walletAddress,
            })
            .select()
            .single();
        }
      }
    }

    // Ensure user_wallets entry exists for existing users
    if (user && session) {
      const { data: existingWallet } = await supabaseClient
        .from('user_wallets')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingWallet) {
        await supabaseClient
          .from('user_wallets')
          .insert({
            user_id: user.id,
            wallet_address: walletAddress,
          })
          .select()
          .single();
      }
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
