-- Populate user_wallets table with existing user data from auth.users metadata
INSERT INTO public.user_wallets (user_id, wallet_address)
SELECT 
  id,
  raw_user_meta_data->>'wallet_address'
FROM auth.users
WHERE raw_user_meta_data->>'wallet_address' IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;