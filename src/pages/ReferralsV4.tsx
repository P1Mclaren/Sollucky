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
import { Copy, DollarSign, Users, Ticket, TrendingUp } from 'lucide-react';

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
    
    console.log('🔍 Loading data for wallet:', wallet);

    try {
      // Load SOL price
      const { data: priceData } = await supabase
        .from('sol_price_cache')
        .select('price_usd')
        .limit(1)
        .maybeSingle();
      
      if (priceData) {
        setSolPrice(Number(priceData.price_usd));
      }

      // Load referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('wallet_address', wallet)
        .maybeSingle();
      
      console.log('Referral code query:', { codeData, codeError });
      if (codeData) {
        setReferralCode(codeData.code);
      }

      // Load referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_wallet', wallet)
        .order('created_at', { ascending: false });
      
      console.log('Referrals query:', { referralsData, referralsError });
      if (referralsData) {
        setReferrals(referralsData);
      }

      // Load earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('wallet_address', wallet)
        .maybeSingle();
      
      console.log('Earnings query:', { earningsData, earningsError });
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
        <div className="container mx-auto max-w-6xl">
          <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-8 text-center">
            Referral Dashboard
          </h1>

          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading your referral data...</p>
            </Card>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                  </div>
                  <p className="text-3xl font-bold text-primary">{referrals.length}</p>
                </Card>

                <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Ticket className="w-5 h-5 text-accent" />
                    <p className="text-sm text-muted-foreground">Tickets Sold</p>
                  </div>
                  <p className="text-3xl font-bold text-accent">
                    {referrals.reduce((sum, r) => sum + r.tickets_purchased, 0)}
                  </p>
                </Card>

                <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatSol(earnings.total)} SOL
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${formatUsd(earnings.total)}
                  </p>
                </Card>

                <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-accent" />
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <p className="text-2xl font-bold text-accent">
                    {formatSol(earnings.pending)} SOL
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${formatUsd(earnings.pending)}
                  </p>
                </Card>
              </div>

              {/* Referral Code Section */}
              <Card className="p-6 mb-8 bg-card/80 backdrop-blur-sm border-primary/30">
                <h2 className="font-orbitron text-2xl font-bold mb-4">Your Referral Code</h2>
                
                {referralCode ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 bg-primary/10 rounded-lg border border-primary/30">
                      <p className="text-3xl font-bold font-mono text-primary text-center">
                        {referralCode}
                      </p>
                    </div>
                    <Button
                      onClick={copyCode}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Create your unique referral code to start earning rewards
                    </p>
                    <div className="flex gap-4">
                      <Input
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="YOURCODE"
                        maxLength={20}
                        className="flex-1"
                      />
                      <Button
                        onClick={createReferralCode}
                        disabled={!newCode}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Create Code
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Referrals List */}
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30">
                <h2 className="font-orbitron text-2xl font-bold mb-4">Your Referrals</h2>
                
                {referrals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No referrals yet. Share your code to start earning!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {referrals.map((referral, index) => (
                      <div
                        key={referral.id}
                        className="p-4 bg-background/50 rounded-lg border border-primary/20"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-mono text-sm text-muted-foreground">
                              {referral.referred_wallet.slice(0, 8)}...{referral.referred_wallet.slice(-8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(referral.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {referral.tickets_purchased} tickets
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Debug Info */}
              <Card className="p-4 mt-8 bg-card/50 backdrop-blur-sm border-muted">
                <details>
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Debug Info
                  </summary>
                  <div className="mt-4 space-y-2 text-xs font-mono">
                    <p>Wallet: {publicKey.toString()}</p>
                    <p>Referral Code: {referralCode || 'None'}</p>
                    <p>Referrals Count: {referrals.length}</p>
                    <p>Total Earned: {earnings.total} lamports</p>
                    <p>Pending: {earnings.pending} lamports</p>
                    <p>Withdrawn: {earnings.withdrawn} lamports</p>
                  </div>
                </details>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
