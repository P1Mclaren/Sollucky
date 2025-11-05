-- Remove duplicate conflicting RLS policy on referral_earnings
DROP POLICY IF EXISTS "Users view own earnings only" ON public.referral_earnings;

-- The correct policy using JWT is already there: "Users can view own earnings"