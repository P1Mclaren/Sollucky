import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';

export function Navbar() {
  const location = useLocation();
  const { connected } = useWallet();
  
  const isActive = (path: string) => location.pathname === path;
  
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
          {connected && (
            <Link
              to="/profile"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/profile') 
                  ? 'bg-primary/20 text-primary border border-primary/50' 
                  : 'text-foreground hover:text-primary hover:bg-primary/10 border border-transparent'
              }`}
            >
              Profile
            </Link>
          )}
          <WalletMultiButton className="!bg-gradient-to-r !from-primary !to-primary/80 hover:!from-primary/90 hover:!to-primary/70 !rounded-xl !h-11 !px-6 !transition-all !duration-300 !font-medium !border-0 !shadow-lg hover:!shadow-xl !text-white" />
        </div>
      </div>
    </motion.nav>
  );
}
