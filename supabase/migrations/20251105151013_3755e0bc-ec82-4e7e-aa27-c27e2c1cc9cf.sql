-- Create secure user-wallet mapping table
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Users can only read their own wallet mapping
CREATE POLICY "Users can view own wallet"
ON public.user_wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only service role can insert/update (prevents user manipulation)
CREATE POLICY "Service role manages wallets"
ON public.user_wallets FOR ALL
USING (false)
WITH CHECK (false);

-- Create index for performance
CREATE INDEX idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX idx_user_wallets_wallet_address ON public.user_wallets(wallet_address);

-- Helper function to get wallet address for current user
CREATE OR REPLACE FUNCTION public.get_user_wallet()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wallet_address 
  FROM public.user_wallets 
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Now update RLS policies to use the secure mapping

-- Fix referrals table RLS policy
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;

CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
TO authenticated
USING (referrer_wallet = get_user_wallet());

-- Fix referral_earnings table RLS policy  
DROP POLICY IF EXISTS "Users view own earnings only" ON public.referral_earnings;

CREATE POLICY "Users view own earnings only" 
ON public.referral_earnings FOR SELECT
TO authenticated
USING (wallet_address = get_user_wallet());

-- Fix fund_splits table RLS policy
DROP POLICY IF EXISTS "Only admins can view fund splits" ON public.fund_splits;

CREATE POLICY "Only admins can view fund splits"
ON public.fund_splits FOR SELECT
TO authenticated
USING (has_role(get_user_wallet(), 'admin'));

-- Fix audit_log RLS policy
DROP POLICY IF EXISTS "Admins can view audit log without wallet exposure" ON public.audit_log;

CREATE POLICY "Admins can view audit log without wallet exposure"
ON public.audit_log FOR SELECT
TO authenticated
USING (has_role(get_user_wallet(), 'admin'));