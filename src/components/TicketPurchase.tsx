import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Ticket, DollarSign, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useActiveDraw } from '@/hooks/useActiveDraw';
import { useTestMode } from '@/contexts/TestModeContext';

interface TicketPurchaseProps {
  lotteryType: 'monthly' | 'weekly' | 'daily';
  isPreOrder: boolean;
  solPrice: number;
  showReferralInput?: boolean;
}

export function TicketPurchase({ lotteryType, isPreOrder, solPrice, showReferralInput = false }: TicketPurchaseProps) {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { toast } = useToast();
  const { isTestMode } = useTestMode();
  const { draw, loading: drawLoading } = useActiveDraw(lotteryType);
  const [ticketCount, setTicketCount] = useState(1);
  const [referralCode, setReferralCode] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const ticketPriceUsd = 1; // $1 per ticket
  const ticketPriceSol = ticketPriceUsd / solPrice;
  const totalPriceSol = ticketPriceSol * ticketCount;
  const totalPriceUsd = ticketPriceUsd * ticketCount;

  const bonusTickets = isPreOrder && lotteryType === 'monthly' ? ticketCount * 2 : 0;
  const totalTickets = ticketCount + bonusTickets;

  // Get lottery wallet address based on type
  const getLotteryWallet = () => {
    const wallets = {
      monthly: 'TgtoboRzo2uzz9yF7NsaCmJrC7uDt664TMgCDMxoLYvvSJgBmuiovzms3cLnctT8ws9N4R2sLE5W3w4rnQCtrws',
      weekly: '412KtEEM5PrTW2hubE3x3n7vTqkH6kQ4Wgp6FBTjjr1jiC9QvqdvKrZrr4cViawiNWx6Qpie6EmfP5irvRKo76Na',
      daily: '5E1Jdmn3WpLXy4wrG1b4zBv3dCxTis9tmSMZDLTeL5v6edb7SrRamRhGynouwPXBTC93Rtap6kDomr7cMezLAxq7',
    };
    return wallets[lotteryType];
  };

  const handlePurchase = async () => {
    if (!connected || !publicKey || !sendTransaction) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to purchase tickets',
        variant: 'destructive',
      });
      return;
    }

    if (!draw) {
      toast({
        title: 'No active lottery draw',
        description: 'Admin must initialize lottery draws first. Go to /admin-v3 and click "Initialize Lottery Draws" (must be in production mode).',
        variant: 'destructive',
        duration: 8000,
      });
      return;
    }

    setIsPurchasing(true);
    let signature: string | undefined;

    try {
      // Create Solana connection
      const network = isTestMode ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(network, 'confirmed');

      // Create transaction
      const lamports = Math.floor(totalPriceSol * LAMPORTS_PER_SOL);
      const lotteryWallet = new PublicKey(getLotteryWallet());

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: lotteryWallet,
          lamports,
        })
      );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      signature = await sendTransaction(transaction, connection);
      
      toast({
        title: 'Transaction sent',
        description: 'Confirming your transaction...',
      });

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Call edge function to process purchase
      const { data, error } = await supabase.functions.invoke('purchase-tickets', {
        body: {
          walletAddress: publicKey.toString(),
          ticketAmount: ticketCount,
          referralCode: referralCode || undefined,
          txSignature: signature,
          lotteryType,
          drawId: draw.id,
        },
      });

      if (error) throw error;

      setTxSignature(signature);

      toast({
        title: 'Purchase successful! 🎉',
        description: `You purchased ${data.totalTickets} ticket${data.totalTickets > 1 ? 's' : ''} (${ticketCount} + ${data.bonusTickets} bonus)`,
      });

      // Reset form
      setTicketCount(1);
      setReferralCode('');
    } catch (error: any) {
      console.error('Purchase error:', error);
      
      let errorMessage = 'Failed to complete purchase';
      
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Purchase failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2 text-primary">
        <Ticket className="w-6 h-6" />
        <h3 className="font-orbitron text-xl font-bold">Purchase Tickets</h3>
      </div>

      {isPreOrder && lotteryType === 'monthly' && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-primary font-semibold">🎁 Pre-Order Bonus: Get 2× tickets!</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Number of Tickets</label>
          <Input
            type="number"
            min="1"
            value={ticketCount}
            onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-background/50"
          />
        </div>

        {showReferralInput && lotteryType === 'monthly' && (
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Referral Code (Optional)</label>
            <Input
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="bg-background/50"
            />
          </div>
        )}

        <div className="bg-background/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tickets:</span>
            <span className="font-semibold">{ticketCount}</span>
          </div>
          {bonusTickets > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bonus Tickets:</span>
              <span className="font-semibold text-primary">+{bonusTickets}</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-primary/20 pt-2">
            <span className="text-muted-foreground">Total Tickets:</span>
            <span className="font-bold text-primary">{totalTickets}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-primary/20">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Price:
            </span>
            <div className="text-right">
              <div className="font-bold">{totalPriceSol.toFixed(4)} SOL</div>
              <div className="text-xs text-muted-foreground">${totalPriceUsd.toFixed(2)} USD</div>
            </div>
          </div>
        </div>

        <Button
          onClick={handlePurchase}
          disabled={!connected || isPurchasing || drawLoading || !draw}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isPurchasing ? 'Processing...' : drawLoading ? 'Loading...' : !draw ? 'No Active Draw' : `Purchase ${totalTickets} Ticket${totalTickets > 1 ? 's' : ''}`}
        </Button>

        {txSignature && (
          <a
            href={`https://solscan.io/tx/${txSignature}${isTestMode ? '?cluster=devnet' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-primary hover:underline"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}