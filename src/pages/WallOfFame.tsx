import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Trophy, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const WallOfFame = () => {
  const { data: winners, isLoading } = useQuery({
    queryKey: ['winners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lottery_winners')
        .select(`
          *,
          lottery_draws!inner(lottery_type, draw_date)
        `)
        .eq('prize_tier', 'jackpot')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const formatPrize = (lamports: number) => {
    return (lamports / 1000000000).toFixed(4) + ' SOL';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-6 space-y-8">
        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border-2 border-primary rounded-full">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-orbitron text-primary font-semibold">Wall of Fame</span>
          </div>
          <h1 className="font-orbitron text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Lottery Winners
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Celebrating our lucky winners and their prizes!
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : winners && winners.length > 0 ? (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {winners.map((winner: any) => {
              const lotteryType = winner.lottery_draws.lottery_type;
              const isWeekly = lotteryType === 'weekly';
              
              return (
                <div 
                  key={winner.id}
                  className={`bg-card border ${isWeekly ? 'border-accent/30 hover:shadow-accent/20' : 'border-primary/30 hover:shadow-primary/20'} rounded-xl p-5 hover:shadow-lg transition-all group`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${isWeekly ? 'bg-accent/10' : 'bg-primary/10'} rounded-full flex items-center justify-center`}>
                        <Trophy className={`w-5 h-5 ${isWeekly ? 'text-accent' : 'text-primary'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Winner</p>
                        <p className="font-mono font-semibold text-sm">{formatWallet(winner.wallet_address)}</p>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isWeekly ? 'text-accent bg-accent/10 border border-accent/30' : 'text-primary bg-primary/10 border border-primary/30'}`}>
                      <Sparkles className="w-3 h-3" />
                      {lotteryType.charAt(0).toUpperCase() + lotteryType.slice(1)}
                    </span>
                  </div>

                  {/* Prize and Details Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Prize</p>
                      <p className={`font-orbitron text-base font-bold ${isWeekly ? 'text-accent' : 'text-primary'}`}>
                        {formatPrize(winner.prize_lamports)}
                      </p>
                    </div>

                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Tier</p>
                      <p className="font-semibold text-sm capitalize">{winner.prize_tier}</p>
                    </div>

                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Date</p>
                      <p className="font-medium text-sm">
                        {new Date(winner.lottery_draws.draw_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Transaction */}
                  {winner.transaction_signature && (
                    <div className="pt-3 border-t border-border/50">
                      <a 
                        href={`https://solscan.io/tx/${winner.transaction_signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <span>View on Solscan</span>
                        <span className="font-mono">{winner.transaction_signature.slice(0, 8)}...</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 max-w-md mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-orbitron text-2xl font-bold mb-2">No Winners Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to win! Purchase tickets now and try your luck!
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default WallOfFame;