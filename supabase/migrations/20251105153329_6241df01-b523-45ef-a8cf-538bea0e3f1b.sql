-- Temporarily make tables publicly readable for debugging
-- This allows us to see if RLS is the issue

DROP POLICY IF EXISTS "Public can view referral codes for validation" ON public.referral_codes;
CREATE POLICY "Public can view referral codes for validation" 
ON public.referral_codes 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Anyone can view referrals" 
ON public.referrals 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can view own earnings" ON public.referral_earnings;
CREATE POLICY "Anyone can view earnings" 
ON public.referral_earnings 
FOR SELECT 
USING (true);