-- Create referral earnings tracking table
CREATE TABLE public.referral_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  total_earned_lamports BIGINT NOT NULL DEFAULT 0,
  withdrawn_lamports BIGINT NOT NULL DEFAULT 0,
  pending_lamports BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  transaction_signature TEXT
);

-- Create fund tracking table for admin dashboard
CREATE TABLE public.fund_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_signature TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  referral_code TEXT,
  referral_type TEXT NOT NULL, -- 'creator', 'operator', or 'none'
  total_lamports BIGINT NOT NULL,
  creator_funds_lamports BIGINT NOT NULL DEFAULT 0,
  operator_funds_lamports BIGINT NOT NULL DEFAULT 0,
  lottery_funds_lamports BIGINT NOT NULL DEFAULT 0,
  referrer_earnings_lamports BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_earnings
CREATE POLICY "Users can view their own earnings"
ON public.referral_earnings
FOR SELECT
USING (true);

CREATE POLICY "Service can manage earnings"
ON public.referral_earnings
FOR ALL
USING (false)
WITH CHECK (false);

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (true);

CREATE POLICY "Users can create withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service can update withdrawals"
ON public.withdrawal_requests
FOR UPDATE
USING (false);

-- RLS Policies for fund_splits
CREATE POLICY "Public can view fund splits"
ON public.fund_splits
FOR SELECT
USING (true);

CREATE POLICY "Service can insert fund splits"
ON public.fund_splits
FOR INSERT
WITH CHECK (false);

-- Add unique constraint on wallet_address for referral_earnings
ALTER TABLE public.referral_earnings ADD CONSTRAINT unique_wallet_earnings UNIQUE (wallet_address);

-- Add trigger for updated_at
CREATE TRIGGER update_referral_earnings_updated_at
BEFORE UPDATE ON public.referral_earnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();