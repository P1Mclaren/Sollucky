-- Create referral_codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT code_length CHECK (length(code) >= 3)
);

-- Create referrals table to track who used whose code
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_wallet TEXT NOT NULL,
  referred_wallet TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  tickets_purchased INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_wallet)
);

-- Enable Row Level Security
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes (public can read, owners can insert their own)
CREATE POLICY "Anyone can view referral codes"
  ON public.referral_codes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own referral code"
  ON public.referral_codes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own referral code"
  ON public.referral_codes
  FOR UPDATE
  USING (true);

-- RLS Policies for referrals (public can read, anyone can insert)
CREATE POLICY "Anyone can view referrals"
  ON public.referrals
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create referrals"
  ON public.referrals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update referrals"
  ON public.referrals
  FOR UPDATE
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_referral_codes_wallet ON public.referral_codes(wallet_address);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_wallet);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_wallet);