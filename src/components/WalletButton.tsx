import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export function WalletButton() {
  const { publicKey, wallet, connect, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  // Aggressively clear all wallet storage on mount
  useEffect(() => {
    if (!mounted) {
      // Clear ALL storage related to wallets
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('wallet') || key.includes('solana') || key === 'sollucky-wallet') {
          localStorage.removeItem(key);
        }
      });
      
      // Also clear sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes('wallet') || key.includes('solana')) {
          sessionStorage.removeItem(key);
        }
      });
      
      setMounted(true);
    }
  }, [mounted]);

  // Force disconnect if wallet tries to auto-connect
  useEffect(() => {
    if (mounted && publicKey && wallet) {
      // If we detect a connection we didn't initiate, disconnect it
      disconnect().catch(() => {});
    }
  }, [mounted]);

  const handleConnect = async () => {
    if (!wallet) {
      setVisible(true);
    } else {
      try {
        await connect();
      } catch (error) {
        console.error('Connection error:', error);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      // Clear all wallet storage
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('wallet') || key.includes('solana') || key === 'sollucky-wallet') {
          localStorage.removeItem(key);
        }
      });
      
      await disconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  if (!mounted) {
    return <Button disabled>Loading...</Button>;
  }

  if (publicKey) {
    return (
      <Button onClick={handleDisconnect} variant="outline">
        {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={connecting}>
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
