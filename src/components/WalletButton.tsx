import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useRef } from 'react';

export function WalletButton() {
  const { publicKey, disconnect } = useWallet();
  const previousPublicKey = useRef<string | null>(null);

  // Clear localStorage when wallet disconnects or changes
  useEffect(() => {
    const currentAddress = publicKey?.toString() || null;
    
    // Wallet disconnected or changed
    if (previousPublicKey.current && previousPublicKey.current !== currentAddress) {
      // Clear all wallet-related localStorage
      const keysToRemove: string[] = [];
      
      // Get all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keysToRemove.push(key);
        }
      }
      
      // Remove wallet adapter keys
      keysToRemove.forEach(key => {
        if (key.includes('wallet') || key === 'sollucky-wallet') {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.error('Failed to clear wallet cache:', e);
          }
        }
      });
    }
    
    previousPublicKey.current = currentAddress;
  }, [publicKey]);

  // Override disconnect to also clear cache
  const handleDisconnect = async () => {
    try {
      // Clear all wallet-related localStorage
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        if (key.includes('wallet') || key === 'sollucky-wallet') {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.error('Failed to clear wallet cache:', e);
          }
        }
      });
      
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  return <WalletMultiButton />;
}
