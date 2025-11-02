-- Enable realtime for referral tables to prevent withdrawal abuse
ALTER TABLE public.referral_earnings REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER TABLE public.referrals REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_earnings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;