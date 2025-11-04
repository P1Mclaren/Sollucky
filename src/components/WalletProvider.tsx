import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletAuth } from '@/hooks/useWalletAuth';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';
// Import custom wallet styles AFTER default styles to override them
import '../styles/wallet-custom.css';

// Track wallet connections and authenticate
function WalletConnectionManager({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, wallet } = useWallet();
  const { session } = useWalletAuth();

  useEffect(() => {
    if (connected && publicKey) {
      // Wallet tracking is now handled server-side via auth-wallet edge function
      // No client-side tracking needed
    }
  }, [connected, publicKey, wallet]);

  return <>{children}</>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet;
  // Using QuickNode RPC for reliable mainnet access
  const endpoint = useMemo(() => 'https://smart-quiet-sound.solana-mainnet.quiknode.pro/38fc432b1900727c313936f91b2618391eb340d6/', []);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider 
        wallets={wallets} 
        autoConnect={true}
      >
        <WalletModalProvider>
          <WalletConnectionManager>
            {children}
          </WalletConnectionManager>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
