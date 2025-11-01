import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';
// Import custom wallet styles AFTER default styles to override them
import '../styles/wallet-custom.css';

// Inner component to track wallet connections in database
function WalletConnectionManager({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, wallet } = useWallet();

  // Track connections in database only on successful connection
  useEffect(() => {
    if (connected && publicKey) {
      const trackConnection = async () => {
        try {
          const walletAddress = publicKey.toString();
          const walletName = wallet?.adapter?.name || 'Unknown';
          
          await supabase
            .from('wallet_connections')
            .upsert({
              wallet_address: walletAddress,
              wallet_name: walletName,
              last_connected: new Date().toISOString(),
            }, {
              onConflict: 'wallet_address'
            });
        } catch (err) {
          console.error('Failed to track connection:', err);
        }
      };

      trackConnection();
    }
  }, [connected, publicKey, wallet]);

  return <>{children}</>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
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
        autoConnect={false}
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
