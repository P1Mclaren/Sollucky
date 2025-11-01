import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function Navbar() {
  const location = useLocation();
  const { connected, publicKey, disconnect, select } = useWallet();
  const { setVisible } = useWalletModal();
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleConnect = () => {
    select(null); // Clear previous selection
    setVisible(true);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Clear wallet storage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('walletName') || key.includes('wallet-adapter') || key === 'sollucky-wallet') {
          localStorage.removeItem(key);
        }
      });
      select(null);
      toast.success('Disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
  };
  
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
            <>
              <Link
                to="/profile"
                className={`text-sm font-medium transition-colors ${
                  isActive('/profile') ? 'text-primary' : 'text-foreground hover:text-primary'
                }`}
              >
                Profile
              </Link>
              <Link
                to="/referrals"
                className={`text-sm font-medium transition-colors ${
                  isActive('/referrals') ? 'text-primary' : 'text-foreground hover:text-primary'
                }`}
              >
                Referrals
              </Link>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {connected && publicKey ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
                <code className="text-xs font-mono text-primary">
                  {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </code>
              </div>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Wallet className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Connect Wallet</span>
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
