import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Trophy, Sparkles, Calendar } from 'lucide-react';
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
        .eq('paid_at', null)
        .order('created_at', { ascending: false });

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

  const getLotteryColor = (type: string) => {
    switch (type) {
      case 'monthly': return 'text-primary border-primary/30';
      case 'weekly': return 'text-accent border-accent/30';
      case 'daily': return 'text-primary border-primary/30';
      default: return 'text-primary border-primary/30';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        <div className="text-center space-y-4 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-orbitron text-primary font-semibold">Wall of Fame</span>
          </div>
          <h1 className="font-orbitron text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Lottery Winners
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Celebrating our lucky winners and their prizes!
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : winners && winners.length > 0 ? (
          <div className="max-w-6xl mx-auto space-y-6">
            {winners.map((winner: any) => (
              <div 
                key={winner.id}
                className={`bg-card border ${getLotteryColor(winner.lottery_draws.lottery_type)} rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Wallet</p>
                      <p className="font-mono font-semibold">{formatWallet(winner.wallet_address)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Prize</p>
                    <p className="font-orbitron text-xl font-bold text-primary">
                      {formatPrize(winner.prize_lamports)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Tier</p>
                    <p className="font-semibold capitalize">{winner.prize_tier}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Draw Date</p>
                      <p className="font-medium">
                        {new Date(winner.lottery_draws.draw_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-primary/20">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getLotteryColor(winner.lottery_draws.lottery_type)} bg-current/10`}>
                    <Sparkles className="w-4 h-4" />
                    {winner.lottery_draws.lottery_type.charAt(0).toUpperCase() + winner.lottery_draws.lottery_type.slice(1)} Lottery
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-orbitron text-2xl font-bold mb-2">No Winners Yet</h3>
            <p className="text-muted-foreground">
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