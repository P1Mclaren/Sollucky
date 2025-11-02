-- Add unique constraint to referrals table for ON CONFLICT to work
ALTER TABLE public.referrals 
ADD CONSTRAINT referrals_referrer_referred_unique 
UNIQUE (referrer_wallet, referred_wallet);

-- Also ensure referral_earnings table has proper unique constraint on wallet_address
ALTER TABLE public.referral_earnings 
ADD CONSTRAINT referral_earnings_wallet_unique 
UNIQUE (wallet_address);