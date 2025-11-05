import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export function useWalletAuth() {
  const { publicKey, connected } = useWallet();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastWallet, setLastWallet] = useState<string | null>(null);

  useEffect(() => {
    const currentWallet = publicKey?.toString() || null;
    
    // If wallet changed, sign out old session first
    if (lastWallet && currentWallet && lastWallet !== currentWallet) {
      console.log('🔄 Wallet changed, signing out old session');
      supabase.auth.signOut();
      setSession(null);
    }
    
    if (connected && publicKey) {
      setLastWallet(currentWallet);
      authenticateWallet();
    } else {
      setSession(null);
      setLastWallet(null);
    }
  }, [connected, publicKey]);

  const authenticateWallet = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      // Check if we already have a valid session FOR THIS WALLET
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      const sessionWallet = existingSession?.user?.user_metadata?.wallet_address;
      const currentWallet = publicKey.toString();
      
      if (existingSession && sessionWallet === currentWallet) {
        console.log('✅ Existing session found for this wallet');
        setSession(existingSession);
        setLoading(false);
        return;
      } else if (existingSession && sessionWallet !== currentWallet) {
        console.log('🔄 Session wallet mismatch, signing out and reauthenticating');
        await supabase.auth.signOut();
      }

      console.log('🔐 Authenticating wallet:', currentWallet);
      const { data, error } = await supabase.functions.invoke('auth-wallet', {
        body: { walletAddress: currentWallet },
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
