import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Wallet, Ticket, Trophy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [tickets, setTickets] = useState<{
    monthly: number;
    weekly: number;
    daily: number;
  }>({ monthly: 0, weekly: 0, daily: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!connected) {
      navigate('/');
      toast.error('Please connect your wallet to view your profile');
    }
  }, [connected, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!publicKey) return;
      
      setIsLoading(true);
      try {
        // Fetch balance
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);

        // Fetch tickets from database
        const walletAddress = publicKey.toString();
        const { data: draws } = await supabase
          .from('lottery_draws')
          .select('id, lottery_type, status')
          .in('status', ['pre-order', 'active']);

        if (draws) {
          const ticketCounts = { monthly: 0, weekly: 0, daily: 0 };
          
          for (const draw of draws) {
            const { data: userTickets } = await supabase
              .from('lottery_tickets')
              .select('id')
              .eq('draw_id', draw.id)
              .eq('wallet_address', walletAddress);

            if (userTickets) {
              ticketCounts[draw.lottery_type as keyof typeof ticketCounts] += userTickets.length;
            }
          }

          setTickets(ticketCounts);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [publicKey, connection]);

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <main className="relative pt-24 pb-20 px-4 min-h-screen">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-8 text-center">
              Your Profile
            </h1>

            {/* Wallet Info Card */}
            <Card className="p-6 mb-8 bg-card/80 backdrop-blur-sm border-primary/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected Wallet</p>
                  <p className="font-mono text-lg">
                    {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-orbitron text-2xl font-bold text-primary">
                    {balance.toFixed(4)} SOL
                  </span>
                </div>
              </div>
            </Card>

            {/* Tickets Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Link to="/monthly">
                <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30 hover:border-primary/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-primary" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-orbitron text-xl font-bold mb-2">Monthly Lottery</h3>
                  <p className="text-3xl font-bold text-primary">{tickets.monthly}</p>
                  <p className="text-sm text-muted-foreground">tickets owned</p>
                </Card>
              </Link>

              <Link to="/weekly">
                <Card className="p-6 bg-card/80 backdrop-blur-sm border-accent/30 hover:border-accent/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-accent" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="font-orbitron text-xl font-bold mb-2">Weekly Lottery</h3>
                  <p className="text-3xl font-bold text-accent">{tickets.weekly}</p>
                  <p className="text-sm text-muted-foreground">tickets owned</p>
                </Card>
              </Link>

              <Link to="/daily">
                <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30 hover:border-primary/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-primary" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-orbitron text-xl font-bold mb-2">Daily Lottery</h3>
                  <p className="text-3xl font-bold text-primary">{tickets.daily}</p>
                  <p className="text-sm text-muted-foreground">tickets owned</p>
                </Card>
              </Link>
            </div>

            {/* Quick Actions */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30 mb-8">
              <h3 className="font-orbitron text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/monthly">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Purchase Monthly Tickets
                  </Button>
                </Link>
                <Link to="/referrals">
                  <Button variant="outline" className="w-full border-primary/30">
                    View Referral Earnings
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Winners Link */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-xl font-bold">Check Past Winners</h3>
                    <p className="text-sm text-muted-foreground">View the Wall of Fame</p>
                  </div>
                </div>
                <Link to="/wall-of-fame">
                  <Button variant="outline" className="border-primary/30">
                    View Winners
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}