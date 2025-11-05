import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export function useWalletAuth() {
  const { publicKey, connected } = useWallet();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      authenticateWallet();
    } else {
      setSession(null);
    }
  }, [connected, publicKey]);

  const authenticateWallet = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      // Check if we already have a valid session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        console.log('✅ Existing session found');
        setSession(existingSession);
        setLoading(false);
        return;
      }

      console.log('🔐 Authenticating wallet:', publicKey.toString());
      const { data, error } = await supabase.functions.invoke('auth-wallet', {
        body: { walletAddress: publicKey.toString() },
      });

      if (error) {
        console.error('❌ Wallet authentication error:', error);
        setLoading(false);
        return;
      }

      console.log('Auth response:', data);

      if (data?.session) {
        console.log('✅ Session created successfully');
        setSession(data.session);
        // Set the session in Supabase client
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      } else if (data?.message) {
        console.log('ℹ️ Auth message:', data.message);
      }
    } catch (error) {
      console.error('❌ Failed to authenticate wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  return { session, loading };
}
