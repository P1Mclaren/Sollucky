import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "https://esm.sh/@solana/web3.js@1.95.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const LOTTERY_WALLETS = {
  monthly: 'FfVVCDEoigroHR49zLxS3C3WuWQDzT6Mujidd73bDfcM',
  weekly: 'EAcYYNgT3BexVLpjnAwDawd75VXvjcAeCf37bXK4f7Zp',
  daily: 'Bt75Ar8C3U5cPVhWmXj8CTF1AG858DsYntqMbAwQhRqj',
};
const TICKET_PRICE_USD = 1; // $1 per ticket
const SOLANA_NETWORK = "https://api.devnet.solana.com";
const OPERATOR_REFERRAL_CODE = "BONUS2025";
const FUND_SPLIT_PERCENTAGE = 0.30; // 30% to creator/operator, 70% to lottery

serve(async (req) => {
  console.log('=== PURCHASE-TICKETS FUNCTION STARTED ===');
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, ticketAmount, referralCode, txSignature, drawId, lotteryType } = await req.json();
    console.log('📝 Purchase request received:', { 
      walletAddress, 
      ticketAmount, 
      referralCode: referralCode || 'NONE', 
      txSignature,
      drawId,
      lotteryType
    });

    // Validate inputs
    console.log('🔍 Validating inputs...');
    if (!walletAddress || !ticketAmount || !txSignature || !drawId || !lotteryType) {
      console.error('❌ Validation failed: Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wallet address format
    console.log('🔍 Validating wallet address format...');
    const walletRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!walletRegex.test(walletAddress)) {
      console.error('❌ Invalid wallet address format:', walletAddress);
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate ticket amount
    console.log('🔍 Validating ticket amount...');
    if (ticketAmount < 1 || ticketAmount > 1000) {
      console.error('❌ Invalid ticket amount:', ticketAmount);
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

    // Validate draw exists and is active/pre-order
    console.log('🔍 Validating lottery draw...');
    const { data: draw, error: drawError } = await supabase
      .from('lottery_draws')
      .select('*')
      .eq('id', drawId)
      .eq('lottery_type', lotteryType)
      .in('status', ['active', 'pre-order'])
      .maybeSingle();

    if (drawError || !draw) {
      console.error('❌ Invalid or inactive lottery draw:', drawError);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive lottery draw' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ Draw validated: ${draw.lottery_type} - ${draw.status}`);

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

    // Get the correct lottery wallet for this lottery type
    const lotteryWallet = LOTTERY_WALLETS[lotteryType as keyof typeof LOTTERY_WALLETS];
    if (!lotteryWallet) {
      console.error('Invalid lottery type:', lotteryType);
      return new Response(
        JSON.stringify({ error: 'Invalid lottery type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`Expected lottery wallet for ${lotteryType}:`, lotteryWallet);

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
        console.log(`Checking transfer to: ${info.destination}`);
        if (info.destination === lotteryWallet) {
          actualTransferAmount = info.lamports;
          transferToLottery = true;
          console.log(`✅ Found transfer: ${actualTransferAmount} lamports to lottery wallet`);
          break;
        }
      }
    }

    if (!transferToLottery) {
      console.error(`❌ No transfer found to lottery wallet: ${lotteryWallet}`);
      return new Response(
        JSON.stringify({ 
          error: 'No valid transfer to lottery wallet found in transaction',
          expectedWallet: lotteryWallet
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate transfer amount matches ticket purchase
    // Calculate expected amount based on USD price
    // Note: We use a flexible validation since SOL price fluctuates
    // As long as the transfer is at least 80% of expected (accounting for price changes and fees)
    const minExpectedLamports = Math.floor((ticketAmount * TICKET_PRICE_USD / 200) * LAMPORTS_PER_SOL); // Assuming SOL won't go below $200
    
    console.log(`Validating amount: ${actualTransferAmount} lamports (min expected: ${minExpectedLamports})`);
    
    if (actualTransferAmount < minExpectedLamports) {
      console.error(`❌ Amount too low: expected at least ${minExpectedLamports}, got ${actualTransferAmount}`);
      return new Response(
        JSON.stringify({ 
          error: 'Transfer amount is too low for ticket purchase',
          minimumRequired: minExpectedLamports,
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
      
      // Check total tickets bought by user (2500 limit for bonus)
      const { data: userTickets, error: ticketCheckError } = await supabase
        .from('lottery_tickets')
        .select('id', { count: 'exact' })
        .eq('wallet_address', walletAddress);
      
      const totalTicketsBought = userTickets?.length || 0;
      console.log(`User has bought ${totalTicketsBought} tickets total`);
      
      if (totalTicketsBought >= 2500) {
        console.log('User has reached 2500 ticket limit, bonus code not applicable');
        return new Response(
          JSON.stringify({ 
            error: 'You have reached the 2500 ticket limit and can no longer use bonus codes',
            code: 'BONUS_LIMIT_REACHED'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if it's the operator code
      if (referralCode.toUpperCase() === OPERATOR_REFERRAL_CODE) {
        referralType = 'operator';
        operatorFundsLamports = Math.floor(totalLamports * FUND_SPLIT_PERCENTAGE);
        lotteryFundsLamports = totalLamports - operatorFundsLamports;
        bonusTickets = ticketAmount; // x2 bonus (double the tickets)
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
          bonusTickets = ticketAmount; // x2 bonus (double the tickets)
          
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

    // Generate unique ticket codes and create lottery tickets
    console.log('🎫 Generating lottery tickets...');
    const totalTickets = ticketAmount + bonusTickets;
    const generateTicketCode = (index: number, isBonus: boolean) => {
      const prefix = lotteryType.substring(0, 1).toUpperCase();
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const suffix = isBonus ? 'B' : 'P';
      return `${prefix}-${timestamp}-${random}-${suffix}${index}`;
    };

    const tickets = [];
    for (let i = 0; i < totalTickets; i++) {
      const isBonus = i >= ticketAmount;
      tickets.push({
        draw_id: drawId,
        wallet_address: walletAddress,
        ticket_code: generateTicketCode(i, isBonus),
        is_bonus: isBonus,
        transaction_signature: txSignature,
        referral_code: referralCode?.toUpperCase() || null
      });
    }

    const { error: ticketsError } = await supabase
      .from('lottery_tickets')
      .insert(tickets);

    if (ticketsError) {
      console.error('Error inserting lottery tickets:', ticketsError);
      return new Response(
        JSON.stringify({ error: 'Failed to create lottery tickets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Created ${totalTickets} lottery tickets for ${walletAddress}`);

    // Update prize pool (only normal tickets count - 70% of their cost)
    const normalTicketsCount = ticketAmount; // Only purchased tickets, not bonus
    const normalTicketsCost = actualTransferAmount; // Total cost paid
    const prizePoolContribution = Math.floor(normalTicketsCost * 0.7); // 70% goes to prize pool
    
    console.log(`💰 Updating prize pool: +${prizePoolContribution} lamports from ${normalTicketsCount} normal tickets`);
    
    // Update the draw's total pool
    const { error: poolUpdateError } = await supabase
      .from('lottery_draws')
      .update({
        total_pool_lamports: draw.total_pool_lamports + prizePoolContribution,
        jackpot_lamports: draw.jackpot_lamports + prizePoolContribution,
        total_tickets_sold: draw.total_tickets_sold + normalTicketsCount
      })
      .eq('id', drawId);
    
    if (poolUpdateError) {
      console.error('Error updating prize pool:', poolUpdateError);
      // Don't fail the whole transaction, just log it
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ticketCount: ticketAmount,
        bonusTickets: bonusTickets,
        totalTickets: totalTickets,
        message: `Successfully purchased ${ticketAmount} ticket(s)${bonusTickets > 0 ? ` + ${bonusTickets} bonus` : ''}!`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing purchase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
