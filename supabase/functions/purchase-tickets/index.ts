import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL, PublicKey } from "https://esm.sh/@solana/web3.js@1.95.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const LOTTERY_WALLET = 'HJJEjQRRzCkx7B9j8JABQjTxn7dDCnMdZLnynDLN3if5';
const PRICE_PER_TICKET_SOL = 1; // 1 SOL per ticket
const SOLANA_NETWORK = 'devnet'; // Change to 'mainnet-beta' for production
const OPERATOR_REFERRAL_CODE = "BONUS2025";
const REFERRER_PERCENTAGE = 0.25; // 25% for referrers
const FUND_SPLIT_PERCENTAGE = 0.30; // 30% to creator/operator, 70% to lottery

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

    // Validate wallet address format (basic Solana address check)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if transaction signature has already been processed (prevent replay attacks)
    const { data: existingTx } = await supabase
      .from('processed_transactions')
      .select('id')
      .eq('transaction_signature', transactionSignature)
      .maybeSingle();

    if (existingTx) {
      console.log('Transaction already processed:', transactionSignature);
      return new Response(
        JSON.stringify({ error: 'Transaction already processed' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify transaction on Solana blockchain
    console.log('Verifying transaction on Solana blockchain...');
    const connection = new Connection(clusterApiUrl(SOLANA_NETWORK), 'confirmed');
    
    let transaction;
    try {
      transaction = await connection.getTransaction(transactionSignature, {
        maxSupportedTransactionVersion: 0
      });
    } catch (txError) {
      console.error('Error fetching transaction:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify transaction on blockchain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transaction) {
      console.log('Transaction not found on blockchain:', transactionSignature);
      return new Response(
        JSON.stringify({ error: 'Transaction not found on blockchain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if transaction was successful
    if (transaction.meta?.err) {
      console.log('Transaction failed on blockchain:', transaction.meta.err);
      return new Response(
        JSON.stringify({ error: 'Transaction failed on blockchain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate transaction details
    const expectedAmount = ticketAmount * PRICE_PER_TICKET_SOL * LAMPORTS_PER_SOL;
    const lotteryWalletPubkey = new PublicKey(LOTTERY_WALLET);
    const senderPubkey = new PublicKey(walletAddress);

    // Find the transfer in the transaction
    const preBalances = transaction.meta?.preBalances || [];
    const postBalances = transaction.meta?.postBalances || [];
    const accountKeys = transaction.transaction.message.getAccountKeys().staticAccountKeys;

    let transferFound = false;
    let actualTransferAmount = 0;

    for (let i = 0; i < accountKeys.length; i++) {
      const accountKey = accountKeys[i];
      
      // Check if this is the lottery wallet receiving funds
      if (accountKey.equals(lotteryWalletPubkey)) {
        const balanceChange = postBalances[i] - preBalances[i];
        if (balanceChange > 0) {
          actualTransferAmount = balanceChange;
          
          // Verify sender
          for (let j = 0; j < accountKeys.length; j++) {
            if (accountKeys[j].equals(senderPubkey)) {
              const senderBalanceChange = postBalances[j] - preBalances[j];
              if (senderBalanceChange < 0) {
                transferFound = true;
                break;
              }
            }
          }
        }
      }
    }

    if (!transferFound) {
      console.log('No valid transfer found in transaction');
      return new Response(
        JSON.stringify({ error: 'Transaction does not contain a valid transfer to lottery wallet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Allow small tolerance for transaction fees (5%)
    const minAcceptableAmount = expectedAmount * 0.95;
    if (actualTransferAmount < minAcceptableAmount) {
      console.log('Transfer amount mismatch:', { 
        expected: expectedAmount, 
        actual: actualTransferAmount,
        minAcceptable: minAcceptableAmount 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Transfer amount does not match ticket purchase',
          expected: expectedAmount / LAMPORTS_PER_SOL,
          actual: actualTransferAmount / LAMPORTS_PER_SOL
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction verified successfully:', {
      signature: transactionSignature,
      amount: actualTransferAmount / LAMPORTS_PER_SOL,
      tickets: ticketAmount
    });

    // Record the processed transaction
    const { error: txRecordError } = await supabase
      .from('processed_transactions')
      .insert({
        transaction_signature: transactionSignature,
        wallet_address: walletAddress,
        amount_lamports: actualTransferAmount,
        ticket_count: ticketAmount
      });

    if (txRecordError) {
      console.error('Error recording processed transaction:', txRecordError);
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate fund splits and referrer earnings
    const totalLamports = actualTransferAmount;
    let bonusTickets = 0;
    let referrerWallet = null;
    let referralType = 'none';
    let creatorFundsLamports = 0;
    let operatorFundsLamports = 0;
    let lotteryFundsLamports = totalLamports;
    let referrerEarningsLamports = 0;
    
    if (referralCode) {
      console.log(`Processing referral code: ${referralCode.toUpperCase()}`);
      
      // Check if it's the operator code
      if (referralCode.toUpperCase() === OPERATOR_REFERRAL_CODE) {
        referralType = 'operator';
        operatorFundsLamports = Math.floor(totalLamports * FUND_SPLIT_PERCENTAGE);
        lotteryFundsLamports = totalLamports - operatorFundsLamports;
        bonusTickets = Math.floor(ticketAmount * 0.1);
        console.log(`Operator code used, operator funds: ${operatorFundsLamports}, lottery funds: ${lotteryFundsLamports}`);
      } else {
        // Look up creator referral code
        const { data: referralData, error: referralError } = await supabase
          .from('referral_codes')
          .select('wallet_address')
          .eq('code', referralCode.toUpperCase())
          .single();

        if (!referralError && referralData) {
          referrerWallet = referralData.wallet_address;
          referralType = 'creator';
          
          // Calculate creator funds (30% of total)
          creatorFundsLamports = Math.floor(totalLamports * FUND_SPLIT_PERCENTAGE);
          lotteryFundsLamports = totalLamports - creatorFundsLamports;
          
          // Calculate referrer earnings (25% of total for the referrer)
          referrerEarningsLamports = Math.floor(totalLamports * REFERRER_PERCENTAGE);
          
          bonusTickets = Math.floor(ticketAmount * 0.1);
          console.log(`Creator code used, creator funds: ${creatorFundsLamports}, referrer earnings: ${referrerEarningsLamports}, lottery funds: ${lotteryFundsLamports}`);
          
          // Record the referral
          await supabase
            .from('referrals')
            .insert({
              referral_code: referralCode.toUpperCase(),
              referrer_wallet: referrerWallet,
              referred_wallet: walletAddress,
              tickets_purchased: ticketAmount
            });
          
          // Get current earnings or create new
          const { data: currentEarnings } = await supabase
            .from('referral_earnings')
            .select('*')
            .eq('wallet_address', referrerWallet)
            .single();

          if (currentEarnings) {
            // Update existing earnings
            const newTotalEarned = Number(currentEarnings.total_earned_lamports) + referrerEarningsLamports;
            const newPending = Number(currentEarnings.pending_lamports) + referrerEarningsLamports;
            
            await supabase
              .from('referral_earnings')
              .update({
                total_earned_lamports: newTotalEarned,
                pending_lamports: newPending
              })
              .eq('wallet_address', referrerWallet);
          } else {
            // Create new earnings record
            await supabase
              .from('referral_earnings')
              .insert({
                wallet_address: referrerWallet,
                total_earned_lamports: referrerEarningsLamports,
                pending_lamports: referrerEarningsLamports
              });
          }
          
          console.log(`Updated earnings for ${referrerWallet}: ${referrerEarningsLamports} lamports`);
        }
      }
    }

    // Record fund split for admin tracking
    await supabase
      .from('fund_splits')
      .insert({
        transaction_signature: transactionSignature,
        wallet_address: walletAddress,
        referral_code: referralCode?.toUpperCase() || null,
        referral_type: referralType,
        total_lamports: totalLamports,
        creator_funds_lamports: creatorFundsLamports,
        operator_funds_lamports: operatorFundsLamports,
        lottery_funds_lamports: lotteryFundsLamports,
        referrer_earnings_lamports: referrerEarningsLamports
      });

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
