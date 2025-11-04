-- Fix wallet_connections RLS policy to work with JWT structure
DROP POLICY IF EXISTS "Users can view own wallet connections" ON wallet_connections;
DROP POLICY IF EXISTS "Users can manage own wallet connections" ON wallet_connections;

-- Service role can manage all connections (for tracking)
CREATE POLICY "Service role manages wallet connections"
ON wallet_connections FOR ALL
USING (false)
WITH CHECK (false);

-- Users can view their own connections
CREATE POLICY "Users view own connections"
ON wallet_connections FOR SELECT
TO authenticated
USING (wallet_address = (auth.jwt() -> 'user_metadata' ->> 'wallet_address'));