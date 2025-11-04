import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Clock, Zap } from 'lucide-react';

interface LotteryFinancials {
  lotteryFunds: number;
  operatorFunds: number;
  creatorFunds: number;
}

interface NextDraw {
  type: string;
  drawDate: string;
  drawId: string;
}

export default function AdminV3() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [drawing, setDrawing] = useState<string | null>(null);
  
  const [monthlyFinancials, setMonthlyFinancials] = useState<LotteryFinancials>({
    lotteryFunds: 0,
    operatorFunds: 0,
    creatorFunds: 0,
  });
  const [weeklyFinancials, setWeeklyFinancials] = useState<LotteryFinancials>({
    lotteryFunds: 0,
    operatorFunds: 0,
    creatorFunds: 0,
  });
  const [dailyFinancials, setDailyFinancials] = useState<LotteryFinancials>({
    lotteryFunds: 0,
    operatorFunds: 0,
    creatorFunds: 0,
  });

  const [nextDraws, setNextDraws] = useState<NextDraw[]>([]);
  const [launchTime] = useState(new Date('2025-11-12T17:00:00Z')); // 6 PM CET = 5 PM UTC
  const [timeUntilLaunch, setTimeUntilLaunch] = useState('');
  const [hasLaunched, setHasLaunched] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!publicKey) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _wallet: publicKey.toBase58(),
          _role: 'admin'
        });

        if (error) throw error;

        if (!data) {
          navigate('/');
          return;
        }

        setIsAdmin(true);
        await fetchFinancials();
        await fetchNextDraws();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [publicKey, navigate]);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const launchTimestamp = launchTime.getTime();
      
      if (now >= launchTimestamp) {
        setHasLaunched(true);
        setTimeUntilLaunch('');
        return;
      }

      const difference = launchTimestamp - now;
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeUntilLaunch(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [launchTime]);

  const fetchFinancials = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Fetch all draws with their tickets and fund splits
      const { data: draws, error: drawsError } = await supabase
        .from('lottery_draws')
        .select(`
          id,
          lottery_type,
          created_at,
          lottery_tickets!inner(
            transaction_signature,
            is_bonus
          )
        `)
        .gte('created_at', firstDayOfMonth);

      if (drawsError) throw drawsError;

      // Get fund splits for this month
      const { data: splits, error: splitsError } = await supabase
        .from('fund_splits')
        .select('*')
        .gte('created_at', firstDayOfMonth);

      if (splitsError) throw splitsError;

      // Create a map of transaction signatures to lottery types
      const txToLotteryType = new Map<string, string>();
      draws?.forEach((draw: any) => {
        draw.lottery_tickets?.forEach((ticket: any) => {
          if (ticket.transaction_signature && !ticket.is_bonus) {
            txToLotteryType.set(ticket.transaction_signature, draw.lottery_type);
          }
        });
      });

      // Initialize financials
      const monthly = { lotteryFunds: 0, operatorFunds: 0, creatorFunds: 0 };
      const weekly = { lotteryFunds: 0, operatorFunds: 0, creatorFunds: 0 };
      const daily = { lotteryFunds: 0, operatorFunds: 0, creatorFunds: 0 };

      splits?.forEach((split: any) => {
        const lotteryType = txToLotteryType.get(split.transaction_signature);
        if (!lotteryType) return;

        const financials = 
          lotteryType === 'monthly' ? monthly :
          lotteryType === 'weekly' ? weekly :
          daily;

        financials.lotteryFunds += Number(split.lottery_funds_lamports) / 1e9;
        financials.operatorFunds += Number(split.operator_funds_lamports) / 1e9;
        financials.creatorFunds += Number(split.creator_funds_lamports) / 1e9;
      });

      setMonthlyFinancials(monthly);
      setWeeklyFinancials(weekly);
      setDailyFinancials(daily);
    } catch (error) {
      console.error('Error fetching financials:', error);
      toast.error('Failed to load financial data');
    }
  };

  const fetchNextDraws = async () => {
    try {
      const { data, error } = await supabase
        .from('lottery_draws')
        .select('id, lottery_type, draw_date, status')
        .in('status', ['active', 'pre-order'])
        .order('draw_date', { ascending: true });

      if (error) throw error;

      const draws = data?.map(d => ({
        type: d.lottery_type,
        drawDate: d.draw_date,
        drawId: d.id
      })) || [];

      setNextDraws(draws);
    } catch (error) {
      console.error('Error fetching next draws:', error);
    }
  };

  const handleDrawNow = async (lotteryType: string) => {
    try {
      setDrawing(lotteryType);

      const draw = nextDraws.find(d => d.type === lotteryType);
      if (!draw) {
        toast.error(`No active ${lotteryType} draw found`);
        return;
      }

      const { data, error } = await supabase.functions.invoke('draw-winners', {
        body: { drawId: draw.drawId }
      });

      if (error) throw error;

      toast.success(`${lotteryType} lottery drawn successfully!`);
      await fetchFinancials();
      await fetchNextDraws();
    } catch (error: any) {
      console.error('Error drawing lottery:', error);
      toast.error(error.message || 'Failed to draw lottery');
    } finally {
      setDrawing(null);
    }
  };

  const formatSOL = (amount: number) => amount.toFixed(4);

  const getTimeUntilDraw = (drawDate: string) => {
    const now = new Date().getTime();
    const draw = new Date(drawDate).getTime();
    const diff = draw - now;

    if (diff <= 0) return 'Draw pending';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <ParticleBackground />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {/* Header with gradient */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-orbitron font-bold mb-3 bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent animate-gradient">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Manage lottery operations and financials</p>
        </div>

        {/* Launch Countdown - Enhanced */}
        {!hasLaunched && (
          <Card className="p-8 mb-8 bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-xl border-primary/50 shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent animate-pulse" />
            <div className="relative flex items-center justify-center gap-6">
              <Clock className="w-12 h-12 text-primary animate-pulse" />
              <div>
                <h2 className="text-2xl font-orbitron font-bold mb-2">🚀 Launch Countdown</h2>
                <p className="text-5xl font-mono font-bold text-primary drop-shadow-lg mb-2">{timeUntilLaunch}</p>
                <p className="text-sm text-muted-foreground">Until November 12, 2025 at 6 PM CET</p>
              </div>
            </div>
          </Card>
        )}

        {/* Monthly Lottery - Premium Card */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-primary/40 shadow-2xl hover:shadow-primary/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    Monthly Lottery
                  </h2>
                  <p className="text-sm text-muted-foreground">Grand Prize Pool</p>
                </div>
              </div>
              <Button 
                onClick={() => handleDrawNow('monthly')}
                disabled={drawing === 'monthly'}
                className="gap-2 px-6 py-6 text-lg font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
              >
                {drawing === 'monthly' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                Draw NOW
              </Button>
            </div>
            
            {hasLaunched && nextDraws.find(d => d.type === 'monthly') && (
              <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/30">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Next Draw In</p>
                <p className="text-2xl font-mono font-bold text-primary">
                  {getTimeUntilDraw(nextDraws.find(d => d.type === 'monthly')!.drawDate)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/20 backdrop-blur-sm hover:border-primary/40 transition-all">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Lottery Pool (70%)</p>
                <p className="text-3xl font-bold text-primary drop-shadow-lg">{formatSOL(monthlyFinancials.lotteryFunds)} SOL</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-transparent rounded-xl border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition-all">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Creator Funds (30%)</p>
                <p className="text-3xl font-bold text-green-400 drop-shadow-lg">{formatSOL(monthlyFinancials.creatorFunds)} SOL</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Operator Funds (30%)</p>
                <p className="text-3xl font-bold text-blue-400 drop-shadow-lg">{formatSOL(monthlyFinancials.operatorFunds)} SOL</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Weekly & Daily in Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Weekly Lottery */}
          <Card className="p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-purple-500/40 shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/20 backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-orbitron font-bold text-purple-400">Weekly</h2>
                    <p className="text-xs text-muted-foreground">Every 7 Days</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleDrawNow('weekly')}
                  disabled={drawing === 'weekly'}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-500/90 hover:to-purple-600/90"
                >
                  {drawing === 'weekly' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Draw
                </Button>
              </div>
              
              {hasLaunched && nextDraws.find(d => d.type === 'weekly') && (
                <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border border-purple-500/30">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Next Draw</p>
                  <p className="text-xl font-mono font-bold text-purple-400">
                    {getTimeUntilDraw(nextDraws.find(d => d.type === 'weekly')!.drawDate)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg border border-purple-500/20">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Lottery (70%)</p>
                  <p className="text-2xl font-bold text-purple-400">{formatSOL(weeklyFinancials.lotteryFunds)} SOL</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg border border-blue-500/20">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Operator (30%)</p>
                  <p className="text-2xl font-bold text-blue-400">{formatSOL(weeklyFinancials.operatorFunds)} SOL</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Daily Lottery */}
          <Card className="p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-orange-500/40 shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-orange-500/20 backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-orbitron font-bold text-orange-400">Daily</h2>
                    <p className="text-xs text-muted-foreground">Every 24 Hours</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleDrawNow('daily')}
                  disabled={drawing === 'daily'}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-500/90 hover:to-orange-600/90"
                >
                  {drawing === 'daily' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Draw
                </Button>
              </div>
              
              {hasLaunched && nextDraws.find(d => d.type === 'daily') && (
                <div className="mb-4 p-3 bg-gradient-to-r from-orange-500/10 to-transparent rounded-lg border border-orange-500/30">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Next Draw</p>
                  <p className="text-xl font-mono font-bold text-orange-400">
                    {getTimeUntilDraw(nextDraws.find(d => d.type === 'daily')!.drawDate)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg border border-orange-500/20">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Lottery (70%)</p>
                  <p className="text-2xl font-bold text-orange-400">{formatSOL(dailyFinancials.lotteryFunds)} SOL</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg border border-blue-500/20">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Operator (30%)</p>
                  <p className="text-2xl font-bold text-blue-400">{formatSOL(dailyFinancials.operatorFunds)} SOL</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
