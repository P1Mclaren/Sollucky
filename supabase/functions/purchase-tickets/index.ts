import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { walletAddress, ticketAmount, referralCode, transactionSignature } = await req.json();

    console.log('Purchase tickets request:', { walletAddress, ticketAmount, referralCode, transactionSignature });

    // Validate inputs
    if (!walletAddress || !ticketAmount || !transactionSignature) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (ticketAmount < 1 || ticketAmount > 1000) {
      return new Response(
        JSON.stringify({ error: 'Ticket amount must be between 1 and 1000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate bonus tickets from referral
    let bonusTickets = 0;
    let referrerWallet = null;

    if (referralCode) {
      const { data: referralData, error: referralError } = await supabase
        .from('referral_codes')
        .select('wallet_address')
        .eq('code', referralCode.toUpperCase())
        .single();

      if (!referralError && referralData) {
        referrerWallet = referralData.wallet_address;
        bonusTickets = Math.floor(ticketAmount * 0.1); // 10% bonus
        
        // Record the referral
        await supabase
          .from('referrals')
          .insert({
            referral_code: referralCode.toUpperCase(),
            referrer_wallet: referrerWallet,
            referred_wallet: walletAddress,
            tickets_purchased: ticketAmount
          });
      }
    }

    // Get or create ticket record for this wallet
    const { data: existingTickets, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    const currentTickets = existingTickets?.ticket_count || 0;
    const currentBonus = existingTickets?.bonus_tickets || 0;
    const newTicketTotal = currentTickets + ticketAmount;
    const newBonusTotal = currentBonus + bonusTickets;

    if (existingTickets) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          ticket_count: newTicketTotal,
          bonus_tickets: newBonusTotal,
          transaction_signature: transactionSignature,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);

      if (updateError) {
        console.error('Error updating tickets:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update tickets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('tickets')
        .insert({
          wallet_address: walletAddress,
          ticket_count: newTicketTotal,
          bonus_tickets: newBonusTotal,
          transaction_signature: transactionSignature
        });

      if (insertError) {
        console.error('Error inserting tickets:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to insert tickets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketCount: newTicketTotal,
        bonusTickets: newBonusTotal
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in purchase-tickets function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
