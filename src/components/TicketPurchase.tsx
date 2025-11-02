import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Ticket, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TicketPurchaseProps {
  lotteryType: 'monthly' | 'weekly' | 'daily';
  isPreOrder: boolean;
  solPrice: number;
  showReferralInput?: boolean;
}

export function TicketPurchase({ lotteryType, isPreOrder, solPrice, showReferralInput = false }: TicketPurchaseProps) {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [ticketCount, setTicketCount] = useState(1);
  const [referralCode, setReferralCode] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const ticketPriceUsd = 1; // $1 per ticket
  const ticketPriceSol = ticketPriceUsd / solPrice;
  const totalPriceSol = ticketPriceSol * ticketCount;
  const totalPriceUsd = ticketPriceUsd * ticketCount;

  const bonusTickets = isPreOrder && lotteryType === 'monthly' ? ticketCount * 2 : 0;
  const totalTickets = ticketCount + bonusTickets;

  const handlePurchase = async () => {
    if (!connected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to purchase tickets',
        variant: 'destructive',
      });
      return;
    }

    setIsPurchasing(true);
    try {
      // TODO: Implement actual purchase logic with edge function
      toast({
        title: 'Purchase initiated',
        description: `Purchasing ${ticketCount} tickets for ${totalPriceSol.toFixed(4)} SOL`,
      });
    } catch (error) {
      toast({
        title: 'Purchase failed',
        description: error instanceof Error ? error.message : 'Unknown error',
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
          disabled={!connected || isPurchasing}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isPurchasing ? 'Processing...' : `Purchase ${totalTickets} Ticket${totalTickets > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}