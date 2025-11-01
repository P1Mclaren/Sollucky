import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "https://esm.sh/@solana/web3.js@1.95.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const LOTTERY_WALLET = "HJJEjQRRzCkx7B9j8JABQjTxn7dDCnMdZLnynDLN3if5";
const TICKET_PRICE_LAMPORTS = 1000000000; // 1 SOL per ticket
const SOLANA_NETWORK = "https://api.devnet.solana.com";
const OPERATOR_REFERRAL_CODE = "BONUS2025";
const FUND_SPLIT_PERCENTAGE = 0.30; // 30% to creator/operator, 70% to lottery

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, ticketAmount, referralCode, txSignature } = await req.json();
    console.log('Purchase request:', { walletAddress, ticketAmount, referralCode, txSignature });

    // Validate inputs
    if (!walletAddress || !ticketAmount || !txSignature) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wallet address format
    const walletRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!walletRegex.test(walletAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate ticket amount
    if (ticketAmount < 1 || ticketAmount > 1000) {
      return new Response(
        JSON.stringify({ error: 'Ticket amount must be between 1 and 1000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if transaction signature was already processed
    const { data: existingTx, error: txCheckError } = await supabase
      .from('processed_transactions')
      .select('id')
      .eq('transaction_signature', txSignature)
      .maybeSingle();

    if (existingTx) {
      console.log('Transaction already processed:', txSignature);
      return new Response(
        JSON.stringify({ error: 'Transaction already processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify transaction on Solana blockchain
    console.log('Verifying transaction on Solana...');
    const connection = new Connection(SOLANA_NETWORK, 'confirmed');
    
    let transaction;
    try {
      transaction = await connection.getParsedTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to verify transaction on blockchain' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transaction) {
      return new Response(
        JSON.stringify({ error: 'Transaction not found on blockchain' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if transaction was successful
    if (transaction.meta?.err) {
      console.error('Transaction failed on chain:', transaction.meta.err);
      return new Response(
        JSON.stringify({ error: 'Transaction failed on blockchain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the transaction details
    const instructions = transaction.transaction.message.instructions;
    let actualTransferAmount = 0;
    let transferToLottery = false;

    // Look for transfer to lottery wallet
    for (const instruction of instructions) {
      if ('parsed' in instruction && instruction.parsed.type === 'transfer') {
        const { info } = instruction.parsed;
        if (info.destination === LOTTERY_WALLET) {
          actualTransferAmount = info.lamports;
          transferToLottery = true;
          console.log(`Found transfer: ${actualTransferAmount} lamports to lottery wallet`);
          break;
        }
      }
    }

    if (!transferToLottery) {
      return new Response(
        JSON.stringify({ error: 'No valid transfer to lottery wallet found in transaction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate transfer amount matches ticket purchase
    const expectedAmount = ticketAmount * TICKET_PRICE_LAMPORTS;
    const tolerance = TICKET_PRICE_LAMPORTS * 0.01; // 1% tolerance for network fees

    if (Math.abs(actualTransferAmount - expectedAmount) > tolerance) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${actualTransferAmount}`);
      return new Response(
        JSON.stringify({ 
          error: 'Transfer amount does not match ticket purchase',
          expected: expectedAmount,
          actual: actualTransferAmount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the sender matches the provided wallet address
    const senderPubkey = transaction.transaction.message.accountKeys[0].pubkey.toString();
    if (senderPubkey !== walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Transaction sender does not match provided wallet address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction verified successfully');

    // Record processed transaction
    const { data: processedTx, error: txRecordError } = await supabase
      .from('processed_transactions')
      .insert({
        transaction_signature: txSignature,
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
        console.log('Operator code applied');
      } else {
        // Check for user-created referral code
        const { data: referralData, error: referralError } = await supabase
          .from('referral_codes')
          .select('wallet_address')
          .eq('code', referralCode.toUpperCase())
          .maybeSingle();

        if (!referralError && referralData) {
          referrerWallet = referralData.wallet_address;
          
          // Fix Issue #3: Prevent self-referrals
          if (referrerWallet === walletAddress) {
            console.log('Self-referral attempt blocked:', walletAddress);
            return new Response(
              JSON.stringify({ 
                error: 'Cannot use your own referral code',
                code: 'SELF_REFERRAL_NOT_ALLOWED'
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          console.log('Valid referral code used:', referralCode, 'Referrer:', referrerWallet);
          
          referralType = 'creator';
          creatorFundsLamports = Math.floor(totalLamports * FUND_SPLIT_PERCENTAGE);
          lotteryFundsLamports = totalLamports - creatorFundsLamports;
          bonusTickets = Math.floor(ticketAmount * 0.1);
          
          // Calculate referrer earnings (25% of total)
          referrerEarningsLamports = Math.floor(totalLamports * 0.25);
          console.log('Bonus tickets:', bonusTickets, 'Referrer earnings:', referrerEarningsLamports);

          // Update or create referral record
          const { error: referralRecordError } = await supabase
            .from('referrals')
            .upsert({
              referrer_wallet: referrerWallet,
              referred_wallet: walletAddress,
              referral_code: referralCode.toUpperCase(),
              tickets_purchased: ticketAmount
            }, {
              onConflict: 'referrer_wallet,referred_wallet',
              ignoreDuplicates: false
            });

          if (referralRecordError) {
            console.error('Error recording referral:', referralRecordError);
          }

          // Update referrer earnings
          const { data: existingEarnings } = await supabase
            .from('referral_earnings')
            .select('*')
            .eq('wallet_address', referrerWallet)
            .maybeSingle();

          if (existingEarnings) {
            const newTotal = BigInt(existingEarnings.total_earned_lamports) + BigInt(referrerEarningsLamports);
            const newPending = BigInt(existingEarnings.pending_lamports) + BigInt(referrerEarningsLamports);
            
            await supabase
              .from('referral_earnings')
              .update({
                total_earned_lamports: newTotal.toString(),
                pending_lamports: newPending.toString()
              })
              .eq('wallet_address', referrerWallet);
          } else {
            await supabase
              .from('referral_earnings')
              .insert({
                wallet_address: referrerWallet,
                total_earned_lamports: referrerEarningsLamports,
                pending_lamports: referrerEarningsLamports,
                withdrawn_lamports: 0
              });
          }
        }
      }
    }

    // Record fund split
    const { error: fundSplitError } = await supabase
      .from('fund_splits')
      .insert({
        transaction_signature: txSignature,
        wallet_address: walletAddress,
        referral_code: referralCode?.toUpperCase() || null,
        referral_type: referralType,
        total_lamports: totalLamports,
        creator_funds_lamports: creatorFundsLamports,
        operator_funds_lamports: operatorFundsLamports,
        lottery_funds_lamports: lotteryFundsLamports,
        referrer_earnings_lamports: referrerEarningsLamports
      });

    if (fundSplitError) {
      console.error('Error recording fund split:', fundSplitError);
    }

    // Update or create ticket record
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    const totalTickets = ticketAmount + bonusTickets;

    if (existingTickets) {
      // Update existing record
      const newTicketCount = existingTickets.ticket_count + ticketAmount;
      const newBonusCount = existingTickets.bonus_tickets + bonusTickets;
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          ticket_count: newTicketCount,
          bonus_tickets: newBonusCount,
          transaction_signature: txSignature
        })
        .eq('wallet_address', walletAddress);

      if (updateError) {
        console.error('Error updating tickets:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update tickets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Updated tickets for ${walletAddress}: ${newTicketCount} tickets, ${newBonusCount} bonus`);

      return new Response(
        JSON.stringify({ 
          success: true,
          tickets: newTicketCount,
          bonusTickets: newBonusCount,
          message: `Successfully purchased ${ticketAmount} ticket(s)${bonusTickets > 0 ? ` + ${bonusTickets} bonus` : ''}!`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('tickets')
        .insert({
          wallet_address: walletAddress,
          ticket_count: ticketAmount,
          bonus_tickets: bonusTickets,
          transaction_signature: txSignature
        });

      if (insertError) {
        console.error('Error inserting tickets:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create ticket record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Created ticket record for ${walletAddress}: ${ticketAmount} tickets, ${bonusTickets} bonus`);

      return new Response(
        JSON.stringify({ 
          success: true,
          tickets: ticketAmount,
          bonusTickets: bonusTickets,
          message: `Successfully purchased ${ticketAmount} ticket(s)${bonusTickets > 0 ? ` + ${bonusTickets} bonus` : ''}!`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing purchase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
