import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PublicKey } from "https://esm.sh/@solana/web3.js@1.95.8";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@5.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MINIMUM_WITHDRAWAL_LAMPORTS = 10000000000; // $10 in lamports (assuming 1 SOL = $1)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, amountLamports, signature, message } = await req.json();

    if (!walletAddress || !amountLamports || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields (walletAddress, amountLamports, signature, message)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fix Issue #2: Verify wallet signature to prove ownership
    try {
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );
      
      if (!isValid) {
        console.log('Invalid signature for withdrawal request:', walletAddress);
        return new Response(
          JSON.stringify({ error: 'Invalid wallet signature - you must prove wallet ownership' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verify message content and timestamp
      const messageData = JSON.parse(message);
      if (messageData.action !== 'withdraw' || messageData.wallet !== walletAddress) {
        return new Response(
          JSON.stringify({ error: 'Invalid message content' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check timestamp - must be within 5 minutes
      const timeDiff = Date.now() - messageData.timestamp;
      if (timeDiff > 300000 || timeDiff < 0) {
        return new Response(
          JSON.stringify({ error: 'Signature expired or invalid timestamp - please try again' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Withdrawal signature verified for:', walletAddress);
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify wallet signature' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check minimum withdrawal amount
    if (amountLamports < MINIMUM_WITHDRAWAL_LAMPORTS) {
      return new Response(
        JSON.stringify({ error: 'Minimum withdrawal is $10' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's earnings
    const { data: earnings, error: earningsError } = await supabase
      .from('referral_earnings')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (earningsError || !earnings) {
      return new Response(
        JSON.stringify({ error: 'No earnings found for this wallet' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has enough pending balance
    if (BigInt(earnings.pending_lamports) < BigInt(amountLamports)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient pending balance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        wallet_address: walletAddress,
        amount_lamports: amountLamports,
        status: 'pending'
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Error creating withdrawal request:', withdrawalError);
      return new Response(
        JSON.stringify({ error: 'Failed to create withdrawal request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update earnings to reflect pending withdrawal
    const newPendingLamports = BigInt(earnings.pending_lamports) - BigInt(amountLamports);
    const { error: updateError } = await supabase
      .from('referral_earnings')
      .update({
        pending_lamports: newPendingLamports.toString()
      })
      .eq('wallet_address', walletAddress);

    if (updateError) {
      console.error('Error updating earnings:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update earnings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Withdrawal request created: ${withdrawal.id} for ${walletAddress}, amount: ${amountLamports}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        withdrawalId: withdrawal.id,
        message: 'Withdrawal request submitted. Funds will be sent from the main wallet soon.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
