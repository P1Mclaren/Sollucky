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
import { Loader2, Clock, Zap, ExternalLink } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
      <ParticleBackground />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-24 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-orbitron font-bold mb-2 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Lottery operations and financial overview</p>
          </div>
          <Button 
            onClick={() => window.open('/', '_blank')}
            variant="outline"
            className="gap-2 border-primary/30 hover:border-primary/50"
          >
            <ExternalLink className="w-4 h-4" />
            Preview Website
          </Button>
        </div>

        {/* Launch Countdown */}
        {!hasLaunched && (
          <Card className="p-6 mb-8 bg-card/30 backdrop-blur-sm border-primary/20">
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Launch Countdown</p>
                <p className="text-2xl font-mono font-bold text-primary">{timeUntilLaunch}</p>
              </div>
              <p className="text-xs text-muted-foreground">Nov 12, 2025 • 6 PM CET</p>
            </div>
          </Card>
        )}

        {/* Monthly Lottery */}
        <Card className="p-6 mb-6 bg-card/30 backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-orbitron font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Monthly Lottery
              </h2>
              {hasLaunched && nextDraws.find(d => d.type === 'monthly') && (
                <p className="text-sm text-muted-foreground mt-1">
                  Next draw: {getTimeUntilDraw(nextDraws.find(d => d.type === 'monthly')!.drawDate)}
                </p>
              )}
            </div>
            <Button 
              onClick={() => handleDrawNow('monthly')}
              disabled={drawing === 'monthly'}
              className="gap-2 bg-gradient-to-r from-primary to-purple-500"
            >
              {drawing === 'monthly' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Draw Now
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Lottery Pool</p>
              <p className="text-2xl font-bold text-primary">{formatSOL(monthlyFinancials.lotteryFunds)}</p>
              <p className="text-xs text-muted-foreground mt-1">SOL • 70%</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Creator Funds</p>
              <p className="text-2xl font-bold text-purple-400">{formatSOL(monthlyFinancials.creatorFunds)}</p>
              <p className="text-xs text-muted-foreground mt-1">SOL • 30% (valid codes)</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Operator Funds</p>
              <p className="text-2xl font-bold text-pink-400">{formatSOL(monthlyFinancials.operatorFunds)}</p>
              <p className="text-xs text-muted-foreground mt-1">SOL • 30% (no code/BONUS2025)</p>
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="mt-4 pt-4 border-t border-primary/10">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-lg font-bold text-foreground">
                  {formatSOL(monthlyFinancials.lotteryFunds + monthlyFinancials.creatorFunds + monthlyFinancials.operatorFunds)} SOL
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Distribution</p>
                <p className="text-lg font-bold text-foreground">70% Lottery + 30% Split</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className="text-lg font-bold text-primary">Active</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Weekly & Daily Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Lottery */}
          <Card className="p-6 bg-card/30 backdrop-blur-sm border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-orbitron font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Weekly Lottery
                </h2>
                {hasLaunched && nextDraws.find(d => d.type === 'weekly') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Next: {getTimeUntilDraw(nextDraws.find(d => d.type === 'weekly')!.drawDate)}
                  </p>
                )}
              </div>
              <Button 
                onClick={() => handleDrawNow('weekly')}
                disabled={drawing === 'weekly'}
                size="sm"
                className="gap-2 bg-gradient-to-r from-primary to-purple-500"
              >
                {drawing === 'weekly' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Draw
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lottery</p>
                <p className="text-xl font-bold text-primary">{formatSOL(weeklyFinancials.lotteryFunds)}</p>
                <p className="text-xs text-muted-foreground">SOL • 70%</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Operator</p>
                <p className="text-xl font-bold text-pink-400">{formatSOL(weeklyFinancials.operatorFunds)}</p>
                <p className="text-xs text-muted-foreground">SOL • 30%</p>
              </div>
            </div>

            <div className="pt-3 border-t border-primary/10 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-sm font-bold">{formatSOL(weeklyFinancials.lotteryFunds + weeklyFinancials.operatorFunds)} SOL</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Frequency</p>
                <p className="text-sm font-bold">Every 7 Days</p>
              </div>
            </div>
          </Card>

          {/* Daily Lottery */}
          <Card className="p-6 bg-card/30 backdrop-blur-sm border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-orbitron font-bold bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
                  Daily Lottery
                </h2>
                {hasLaunched && nextDraws.find(d => d.type === 'daily') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Next: {getTimeUntilDraw(nextDraws.find(d => d.type === 'daily')!.drawDate)}
                  </p>
                )}
              </div>
              <Button 
                onClick={() => handleDrawNow('daily')}
                disabled={drawing === 'daily'}
                size="sm"
                className="gap-2 bg-gradient-to-r from-primary to-pink-500"
              >
                {drawing === 'daily' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Draw
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lottery</p>
                <p className="text-xl font-bold text-primary">{formatSOL(dailyFinancials.lotteryFunds)}</p>
                <p className="text-xs text-muted-foreground">SOL • 70%</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Operator</p>
                <p className="text-xl font-bold text-pink-400">{formatSOL(dailyFinancials.operatorFunds)}</p>
                <p className="text-xs text-muted-foreground">SOL • 30%</p>
              </div>
            </div>

            <div className="pt-3 border-t border-primary/10 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-sm font-bold">{formatSOL(dailyFinancials.lotteryFunds + dailyFinancials.operatorFunds)} SOL</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Frequency</p>
                <p className="text-sm font-bold">Every 24 Hours</p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
