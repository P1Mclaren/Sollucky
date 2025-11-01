import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo, useEffect } from 'react';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';
// Import custom wallet styles AFTER default styles to override them
import '../styles/wallet-custom.css';

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

  // Clear wallet adapter cache on mount to prevent auto-connecting to deleted wallets
  useEffect(() => {
    const clearWalletCache = () => {
      // Clear wallet adapter localStorage keys
      const keysToRemove = [
        'walletName',
        'walletAdapter',
        'walletAccount',
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Failed to clear wallet cache:', e);
        }
      });
    };
    
    clearWalletCache();
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
