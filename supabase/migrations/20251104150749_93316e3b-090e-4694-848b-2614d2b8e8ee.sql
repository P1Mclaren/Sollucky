-- Security Fix 1: Wallet connections - users can only see their own
DROP POLICY IF EXISTS "Allow wallet connection tracking" ON wallet_connections;

CREATE POLICY "Users can view own wallet connections"
ON wallet_connections FOR SELECT
TO authenticated
USING (wallet_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Users can manage own wallet connections"
ON wallet_connections FOR ALL
TO authenticated
USING (wallet_address = auth.jwt() ->> 'wallet_address')
WITH CHECK (wallet_address = auth.jwt() ->> 'wallet_address');

-- Security Fix 2: Referral earnings - users can only see their own
DROP POLICY IF EXISTS "Anyone can view referral earnings" ON referral_earnings;

CREATE POLICY "Users can view own earnings"
ON referral_earnings FOR SELECT
TO authenticated
USING (wallet_address = auth.jwt() ->> 'wallet_address');

-- Security Fix 3: Withdrawal requests - users can only see their own
DROP POLICY IF EXISTS "Anyone can view withdrawal requests" ON withdrawal_requests;

CREATE POLICY "Users can view own withdrawal requests"
ON withdrawal_requests FOR SELECT
TO authenticated
USING (wallet_address = auth.jwt() ->> 'wallet_address');

-- Security Fix 5: Add opt-in flag for Wall of Fame
ALTER TABLE lottery_winners ADD COLUMN IF NOT EXISTS show_on_wall_of_fame boolean DEFAULT false;

-- Update winners view policy to respect privacy flag
DROP POLICY IF EXISTS "Anyone can view winners" ON lottery_winners;

CREATE POLICY "Public can view winners who opted in"
ON lottery_winners FOR SELECT
USING (show_on_wall_of_fame = true OR wallet_address = auth.jwt() ->> 'wallet_address');

-- Security Fix 7: Referrals - users can only see their own referral network
DROP POLICY IF EXISTS "Public can view referrals" ON referrals;

CREATE POLICY "Users can view own referrals"
ON referrals FOR SELECT
TO authenticated
USING (referrer_wallet = auth.jwt() ->> 'wallet_address');

-- Security Fix 8: Audit log - remove public admin wallet visibility
DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;

CREATE POLICY "Admins can view audit log without wallet exposure"
ON audit_log FOR SELECT
TO authenticated
USING (has_role(auth.jwt() ->> 'wallet_address', 'admin'));

-- Security Fix 9: Fund splits - restrict to admins only
DROP POLICY IF EXISTS "Service role only for fund_splits" ON fund_splits;

CREATE POLICY "Only admins can view fund splits"
ON fund_splits FOR SELECT
TO authenticated
USING (has_role(auth.jwt() ->> 'wallet_address', 'admin'));