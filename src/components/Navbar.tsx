import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export function Navbar() {
  const location = useLocation();
  const { connected, publicKey, disconnect } = useWallet();
  const previousPublicKey = useRef<string | null>(null);
  
  const isActive = (path: string) => location.pathname === path;

  // Clear cache when wallet disconnects or changes
  useEffect(() => {
    const currentAddress = publicKey?.toString() || null;
    
    // If wallet was connected and now disconnected, or if wallet address changed
    if (previousPublicKey.current && (!currentAddress || currentAddress !== previousPublicKey.current)) {
      // Clear wallet adapter cache
      const keysToRemove = ['walletName', 'walletAdapter', 'walletAccount'];
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Failed to clear wallet cache:', e);
        }
      });
    }
    
    previousPublicKey.current = currentAddress;
  }, [publicKey]);
  
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-orbitron font-black text-primary text-glow-purple">
            SOLLUCKY
          </div>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              isActive('/') ? 'text-primary' : 'text-foreground hover:text-primary'
            }`}
          >
            Home
          </Link>
          {connected && (
            <Link
              to="/profile"
              className={`text-sm font-medium transition-colors ${
                isActive('/profile') ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            >
              Profile
            </Link>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <WalletMultiButton />
        </div>
      </div>
    </motion.nav>
  );
}
