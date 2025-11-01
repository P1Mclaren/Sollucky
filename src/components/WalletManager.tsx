import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function WalletManager() {
  const { publicKey, disconnect, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = () => setVisible(true);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    
    // Clear wallet name BEFORE disconnect to prevent auto-reconnect
    localStorage.removeItem('walletName');
    
    await disconnect();
    setIsDisconnecting(false);
    toast.success('Disconnected');
  };

  const handleChangeWallet = async () => {
    setIsDisconnecting(true);
    
    // Clear wallet name BEFORE disconnect
    localStorage.removeItem('walletName');
    
    if (connected) {
      await disconnect();
    }
    
    setIsDisconnecting(false);
    setVisible(true);
  };

  if (!connected || !publicKey) {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>Connect your Solana wallet to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnect} className="w-full bg-primary hover:bg-primary/90">
            Select Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Connected Wallet
        </CardTitle>
        <CardDescription>{wallet?.adapter?.name || 'Unknown Wallet'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-background border border-border">
          <p className="text-xs text-muted-foreground mb-1">Address</p>
          <code className="text-sm font-mono text-primary break-all">
            {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
          </code>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleChangeWallet} variant="outline" className="flex-1" disabled={isDisconnecting}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isDisconnecting ? 'animate-spin' : ''}`} />
            Change
          </Button>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
            disabled={isDisconnecting}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
