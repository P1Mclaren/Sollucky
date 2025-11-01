import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export function WalletManager() {
  const { publicKey, disconnect, connected, wallet } = useWallet();

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const handleChangeWallet = async () => {
    try {
      // Disconnect first to allow selecting a different wallet
      await disconnect();
      toast.info('Please select a wallet to connect');
      // The WalletMultiButton will automatically show the modal
    } catch (error) {
      console.error('Error changing wallet:', error);
      toast.error('Failed to change wallet');
    }
  };

  if (!connected || !publicKey) {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your Solana wallet to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
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
        <CardDescription>
          {wallet?.adapter?.name || 'Unknown Wallet'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-background border border-border">
          <p className="text-xs text-muted-foreground mb-1">Address</p>
          <code className="text-sm font-mono text-primary">
            {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
          </code>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleChangeWallet}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Change Wallet
          </Button>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}