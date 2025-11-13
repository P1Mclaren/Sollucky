import { useEffect, useState } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { useDemoMode } from '@/contexts/DemoModeContext';

interface JackpotDisplayProps {
  lotteryType: 'monthly' | 'weekly' | 'daily';
  accentColor?: 'primary' | 'accent' | 'neon-purple';
  isPreOrder?: boolean;
}

export function JackpotDisplay({ lotteryType, accentColor = 'primary', isPreOrder = false }: JackpotDisplayProps) {
  const [prizePool, setPrizePool] = useState<number>(0);
  const [ticketsSold, setTicketsSold] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { isDemoMode } = useDemoMode();

  // Example prize pools for pre-order display (realistic for new platform)
  const examplePrizePools = {
    monthly: 70,   // 70 SOL (~$7000-8400 USD)
    weekly: 15,    // 15 SOL (~$1500-1800 USD)
    daily: 2       // 2 SOL (~$200-240 USD)
  };

  useEffect(() => {
    // If pre-order, show example prizes immediately
    if (isPreOrder) {
      setPrizePool(examplePrizePools[lotteryType]);
      setTicketsSold(0);
      setLoading(false);
      return;
    }

    // Fetch prize pool data
    const fetchPrizePool = async () => {
      // In demo mode, get aggregated demo transaction data
      if (isDemoMode) {
        const { data: demoTransactions } = await supabase
          .from('demo_transactions')
          .select('ticket_count')
          .eq('lottery_type', lotteryType);

        const totalTickets = demoTransactions?.reduce((sum, t) => sum + t.ticket_count, 0) || 0;
        const estimatedPool = totalTickets * 0.1; // 0.1 SOL per ticket average

        setPrizePool(estimatedPool);
        setTicketsSold(totalTickets);
        setLoading(false);
        return;
      }

      // Normal mode - fetch real data
      const { data: draw } = await supabase
        .from('lottery_draws')
        .select('total_pool_lamports, total_tickets_sold')
        .eq('lottery_type', lotteryType)
        .in('status', ['pre-order', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draw) {
        setPrizePool(draw.total_pool_lamports / LAMPORTS_PER_SOL);
        setTicketsSold(draw.total_tickets_sold || 0);
      }
      setLoading(false);
    };

    fetchPrizePool();

    // Set up realtime subscription for updates
    if (isDemoMode) {
      const channel = supabase
        .channel('demo-transactions-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'demo_transactions',
            filter: `lottery_type=eq.${lotteryType}`,
          },
          () => {
            fetchPrizePool();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      const channel = supabase
        .channel('prize-pool-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'lottery_draws',
            filter: `lottery_type=eq.${lotteryType}`,
          },
          (payload: any) => {
            if (payload.new) {
              setPrizePool(payload.new.total_pool_lamports / LAMPORTS_PER_SOL);
              setTicketsSold(payload.new.total_tickets_sold || 0);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [lotteryType, isPreOrder, isDemoMode]);

  const colorClasses = {
    primary: {
      gradient: 'from-primary/20 via-primary/10 to-primary/20',
      border: 'border-primary/50',
      text: 'text-primary',
      glow: 'shadow-[0_0_50px_rgba(139,92,246,0.3)]',
    },
    accent: {
      gradient: 'from-accent/20 via-accent/10 to-accent/20',
      border: 'border-accent/50',
      text: 'text-accent',
      glow: 'shadow-[0_0_50px_rgba(251,191,36,0.3)]',
    },
    'neon-purple': {
      gradient: 'from-neon-purple/20 via-neon-purple/10 to-neon-purple/20',
      border: 'border-neon-purple/50',
      text: 'text-neon-purple',
      glow: 'shadow-[0_0_50px_rgba(168,85,247,0.3)]',
    },
  };

  const colors = colorClasses[accentColor];

  if (loading) {
    return (
      <div className={`bg-gradient-to-r ${colors.gradient} border-2 ${colors.border} rounded-2xl p-6 text-center`}>
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-card/50 rounded w-32 mx-auto"></div>
          <div className="h-12 bg-card/50 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative bg-gradient-to-r ${colors.gradient} border-2 ${colors.border} ${colors.glow} rounded-2xl p-6 overflow-hidden`}
    >
      {/* Animated background sparkles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${colors.text} opacity-20`}
            initial={{ x: Math.random() * 100 + '%', y: Math.random() * 100 + '%' }}
            animate={{
              x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
              y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
              rotate: [0, 360],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 text-center space-y-4">
        {/* Trophy Icon */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-block"
        >
          <div className={`w-16 h-16 bg-background/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border-2 ${colors.border}`}>
            <Trophy className={`w-8 h-8 ${colors.text}`} />
          </div>
        </motion.div>

        {/* Prize Pool Label */}
        <div>
          <p className={`text-sm font-semibold ${colors.text} tracking-wider uppercase mb-2`}>
            {isPreOrder ? 'Possible Prize Pool' : 'Current Prize Pool'}
          </p>
          
          {/* Prize Amount */}
          <motion.div
            key={prizePool}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className={`font-orbitron text-5xl md:text-6xl font-bold ${colors.text} drop-shadow-lg`}>
              {isPreOrder ? `~${prizePool.toFixed(1)}` : prizePool.toFixed(2)} SOL
            </h2>
          </motion.div>

          {/* Tickets Sold */}
          {!isPreOrder && (
            <p className="text-sm text-muted-foreground mt-2">
              {ticketsSold.toLocaleString()} tickets sold
            </p>
          )}
          {isPreOrder && (
            <p className="text-sm text-muted-foreground mt-2">
              Estimated based on initial ticket sales
            </p>
          )}
        </div>

        {/* Growing indicator */}
        {!isPreOrder && ticketsSold > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-background/30 backdrop-blur-sm border ${colors.border}`}
          >
            <Sparkles className={`w-3 h-3 ${colors.text}`} />
            <span className={`text-xs font-semibold ${colors.text}`}>Growing Live!</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
