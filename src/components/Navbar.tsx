import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from 'react';
import { useTestMode } from '@/contexts/TestModeContext';

export function Navbar() {
  const location = useLocation();
  const { connected, publicKey, disconnect, select } = useWallet();
  const { setVisible } = useWalletModal();
  const [isAdmin, setIsAdmin] = useState(false);
  const { isTestMode } = useTestMode();
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const checkAdmin = async () => {
      if (!publicKey) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .rpc('has_role', { _wallet: publicKey.toString(), _role: 'admin' });
      
      setIsAdmin(!!data);
    };

    checkAdmin();
  }, [publicKey]);
  
  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = async () => {
    try {
      // Clear wallet name BEFORE disconnect to prevent auto-reconnect
      localStorage.removeItem('walletName');
      
      await disconnect();
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
      className={`fixed left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80 ${
        isTestMode ? 'top-[36px]' : 'top-0'
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-orbitron font-black text-primary text-glow-purple">
            SOLLUCKY
          </div>
          {isTestMode && (
            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500 text-xs">
              MAINNET
            </Badge>
          )}
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
          <Link
            to="/wall-of-fame"
            className={`text-sm font-medium transition-colors ${
              isActive('/wall-of-fame') ? 'text-primary' : 'text-foreground hover:text-primary'
            }`}
          >
            Winners
          </Link>
          {connected && (
            <>
              <Link
                to="/referrals"
                className={`text-sm font-medium transition-colors ${
                  isActive('/referrals') ? 'text-primary' : 'text-foreground hover:text-primary'
                }`}
              >
                Referrals
              </Link>
              {isAdmin && (
                <Link
                  to="/admin-v3"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/admin-v3') ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {connected && publicKey ? (
            <div className="flex items-center gap-2">
              <Link 
                to="/profile"
                className="hidden sm:block px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <code className="text-xs font-mono text-primary">
                  {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </code>
              </Link>
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
