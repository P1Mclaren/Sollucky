import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, DollarSign, Users, Ticket, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReferralsV4() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  
  const [referralCode, setReferralCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({
    total: 0,
    pending: 0,
    withdrawn: 0
  });
  const [loading, setLoading] = useState(true);
  const [solPrice, setSolPrice] = useState(0);

  useEffect(() => {
    if (!publicKey) {
      navigate('/');
      return;
    }
    loadAllData();
  }, [publicKey]);

  const loadAllData = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    const wallet = publicKey.toString();

    try {
      const { data: priceData } = await supabase
        .from('sol_price_cache')
        .select('price_usd')
        .limit(1)
        .maybeSingle();
      
      if (priceData) setSolPrice(Number(priceData.price_usd));

      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('wallet_address', wallet)
        .maybeSingle();
      
      if (codeData) setReferralCode(codeData.code);

      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_wallet', wallet)
        .order('created_at', { ascending: false });
      
      if (referralsData) setReferrals(referralsData);

      const { data: earningsData } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('wallet_address', wallet)
        .maybeSingle();
      
      if (earningsData) {
        setEarnings({
          total: Number(earningsData.total_earned_lamports),
          pending: Number(earningsData.pending_lamports),
          withdrawn: Number(earningsData.withdrawn_lamports)
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const createReferralCode = async () => {
    if (!publicKey || !newCode) return;

    const code = newCode.toUpperCase().trim();
    
    if (code.length < 4 || code.length > 20) {
      toast.error('Code must be 4-20 characters');
      return;
    }

    if (!/^[A-Z0-9]+$/.test(code)) {
      toast.error('Code can only contain letters and numbers');
      return;
    }

    try {
      const { error } = await supabase
        .from('referral_codes')
        .insert({
          wallet_address: publicKey.toString(),
          code: code
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('This code is already taken');
        } else {
          toast.error('Failed to create code');
        }
        return;
      }

      setReferralCode(code);
      setNewCode('');
      toast.success('Referral code created!');
    } catch (error) {
      console.error('Error creating code:', error);
      toast.error('Failed to create code');
    }
  };

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  const formatSol = (lamports: number) => {
    return (lamports / 1_000_000_000).toFixed(4);
  };

  const formatUsd = (lamports: number) => {
    return ((lamports / 1_000_000_000) * solPrice).toFixed(2);
  };

  if (!publicKey) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <main className="relative pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <h1 className="font-orbitron text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Referral Dashboard
              </h1>
              <p className="text-muted-foreground">
                Earn rewards by sharing your unique referral code
              </p>
            </div>

            {loading ? (
              <Card className="p-8 text-center bg-card/80 backdrop-blur-sm border-primary/30">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Loading your referral data...</p>
              </Card>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="p-4 bg-gradient-to-br from-primary/10 via-card/80 to-card/80 backdrop-blur-sm border-primary/30 hover:border-primary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <Sparkles className="w-4 h-4 text-primary/50" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Total Referrals</p>
                      <p className="text-3xl font-bold text-primary font-orbitron">{referrals.length}</p>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="p-4 bg-gradient-to-br from-accent/10 via-card/80 to-card/80 backdrop-blur-sm border-accent/30 hover:border-accent/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                          <Ticket className="w-5 h-5 text-accent" />
                        </div>
                        <Sparkles className="w-4 h-4 text-accent/50" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Tickets Sold</p>
                      <p className="text-3xl font-bold text-accent font-orbitron">
                        {referrals.reduce((sum, r) => sum + r.tickets_purchased, 0)}
                      </p>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="p-4 bg-gradient-to-br from-primary/10 via-card/80 to-card/80 backdrop-blur-sm border-primary/30 hover:border-primary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <Sparkles className="w-4 h-4 text-primary/50" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
                      <p className="text-2xl font-bold text-primary font-orbitron">
                        {formatSol(earnings.total)} SOL
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ≈ ${formatUsd(earnings.total)}
                      </p>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="p-4 bg-gradient-to-br from-accent/10 via-card/80 to-card/80 backdrop-blur-sm border-accent/30 hover:border-accent/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-accent" />
                        </div>
                        <Sparkles className="w-4 h-4 text-accent/50" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
                      <p className="text-2xl font-bold text-accent font-orbitron">
                        {formatSol(earnings.pending)} SOL
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ≈ ${formatUsd(earnings.pending)}
                      </p>
                    </Card>
                  </motion.div>
                </div>

                {/* Referral Code Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="p-5 mb-6 bg-gradient-to-br from-primary/5 via-accent/5 to-card/80 backdrop-blur-sm border-primary/30 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-50" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <h2 className="font-orbitron text-lg font-bold">Your Referral Code</h2>
                      </div>
                      
                      {referralCode ? (
                        <div className="space-y-3">
                          <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-xl opacity-75 blur group-hover:opacity-100 transition" />
                            <div className="relative p-5 bg-card rounded-lg border border-primary/30">
                              <p className="text-3xl font-bold font-mono text-center tracking-wider bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                                {referralCode}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={copyCode}
                            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Code
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-muted-foreground text-sm text-center">
                            Create your unique code to start earning
                          </p>
                          <div className="flex gap-2">
                            <Input
                              value={newCode}
                              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                              placeholder="YOUR CODE"
                              maxLength={20}
                              className="flex-1 text-center font-mono bg-background/50 border-primary/30 focus:border-primary"
                            />
                            <Button
                              onClick={createReferralCode}
                              disabled={!newCode}
                              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 px-5"
                            >
                              Create
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>

                {/* Referrals List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <h2 className="font-orbitron text-xl font-bold">Your Referrals</h2>
                    </div>
                    
                    {referrals.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-primary/50" />
                        </div>
                        <p className="text-muted-foreground">
                          No referrals yet. Share your code to start earning!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {referrals.map((referral, index) => (
                          <motion.div
                            key={referral.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + index * 0.05 }}
                            className="p-4 bg-gradient-to-r from-background/50 to-background/30 rounded-lg border border-primary/20 hover:border-primary/40 transition-all"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-mono text-sm text-muted-foreground mb-0.5">
                                  {referral.referred_wallet.slice(0, 10)}...{referral.referred_wallet.slice(-10)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(referral.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary font-orbitron">
                                  {referral.tickets_purchased}
                                </p>
                                <p className="text-xs text-muted-foreground">tickets</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>

              </>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
