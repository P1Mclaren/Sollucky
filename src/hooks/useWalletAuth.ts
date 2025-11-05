import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export function useWalletAuth() {
  const { publicKey, connected, disconnect } = useWallet();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (connected && publicKey) {
        // Check if session wallet matches connected wallet
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const sessionWallet = currentSession?.user?.user_metadata?.wallet_address;
        const connectedWallet = publicKey.toString();
        
        if (currentSession && sessionWallet && sessionWallet !== connectedWallet) {
          console.log('🔄 Wallet mismatch detected. Session:', sessionWallet, 'Connected:', connectedWallet);
          console.log('🚪 Signing out old session...');
          await supabase.auth.signOut();
          setSession(null);
          // Small delay before re-authenticating
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        authenticateWallet();
      } else {
        setSession(null);
      }
    };
    
    handleAuth();
  }, [connected, publicKey]);

  const authenticateWallet = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const currentWallet = publicKey.toString();
      console.log('🔐 Authenticating wallet:', currentWallet);
      
      const { data, error } = await supabase.functions.invoke('auth-wallet', {
        body: { walletAddress: currentWallet },
      });

      if (error) {
        console.error('❌ Wallet authentication error:', error);
        setLoading(false);
        return;
      }

      console.log('✅ Auth response:', data);

      if (data?.session) {
        const sessionWallet = data.session.user?.user_metadata?.wallet_address;
        console.log('✅ Session created for wallet:', sessionWallet);
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
