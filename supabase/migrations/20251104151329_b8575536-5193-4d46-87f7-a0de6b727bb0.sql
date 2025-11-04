-- Wallet connections should be managed server-side only
-- Remove all RLS policies and make it service-role only
DROP POLICY IF EXISTS "Service role manages wallet connections" ON wallet_connections;
DROP POLICY IF EXISTS "Users view own connections" ON wallet_connections;

-- Only service role can access (tracking happens server-side via edge functions)
CREATE POLICY "Only service role accesses wallet connections"
ON wallet_connections FOR ALL
USING (false)
WITH CHECK (false);