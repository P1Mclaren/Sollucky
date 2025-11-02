import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import bs58 from "bs58";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Users, Ticket, Wallet, TrendingUp, Clock } from "lucide-react";

interface ReferralWithDetails {
  id: string;
  referred_wallet: string;
  referral_code: string;
  tickets_purchased: number;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  amount_lamports: number;
  status: string;
  created_at: string;
  transaction_signature: string | null;
}

const LAMPORTS_PER_SOL = 1000000000;
const MINIMUM_WITHDRAWAL_SOL = 0.05;

const ReferralsV3 = () => {
  const { publicKey, wallet } = useWallet();
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [totalEarnedLamports, setTotalEarnedLamports] = useState(0);
  const [pendingLamports, setPendingLamports] = useState(0);
  const [withdrawnLamports, setWithdrawnLamports] = useState(0);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [withdrawing, setWithdrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState(0);

  useEffect(() => {
    if (!publicKey) {
      navigate("/");
      return;
    }
    loadAllData();

    // Set up realtime subscriptions for instant updates
    const earningsChannel = supabase
      .channel('referral-earnings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_earnings',
          filter: `wallet_address=eq.${publicKey.toString()}`
        },
        () => {
          console.log('Earnings updated, reloading...');
          loadEarnings();
        }
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('withdrawal-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
          filter: `wallet_address=eq.${publicKey.toString()}`
        },
        () => {
          console.log('Withdrawals updated, reloading...');
          loadWithdrawalHistory();
          loadEarnings();
        }
      )
      .subscribe();

    const referralsChannel = supabase
      .channel('referrals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_wallet=eq.${publicKey.toString()}`
        },
        () => {
          console.log('Referrals updated, reloading...');
          loadReferrals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(earningsChannel);
      supabase.removeChannel(withdrawalsChannel);
      supabase.removeChannel(referralsChannel);
    };
  }, [publicKey, navigate]);

  const loadAllData = async () => {
    if (!publicKey) return;
    
    await Promise.all([
      loadReferralCode(),
      loadReferrals(),
      loadEarnings(),
      loadWithdrawalHistory(),
      loadSolPrice()
    ]);
  };

  const loadSolPrice = async () => {
    const { data, error } = await supabase
      .from("sol_price_cache")
      .select("price_usd")
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setSolPrice(Number(data.price_usd));
    }
  };

  const loadReferralCode = async () => {
    if (!publicKey) return;

    const { data, error } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("wallet_address", publicKey.toString())
      .maybeSingle();

    if (!error && data) {
      setReferralCode(data.code);
    }
  };

  const loadReferrals = async () => {
    if (!publicKey) return;

    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_wallet", publicKey.toString())
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReferrals(data);
    }
  };

  const loadEarnings = async () => {
    if (!publicKey) return;

    const { data, error } = await supabase
      .from("referral_earnings")
      .select("*")
      .eq("wallet_address", publicKey.toString())
      .maybeSingle();

    if (!error && data) {
      setTotalEarnedLamports(Number(data.total_earned_lamports));
      setPendingLamports(Number(data.pending_lamports));
      setWithdrawnLamports(Number(data.withdrawn_lamports));
    } else {
      setTotalEarnedLamports(0);
      setPendingLamports(0);
      setWithdrawnLamports(0);
    }
  };

  const loadWithdrawalHistory = async () => {
    if (!publicKey) return;

    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("wallet_address", publicKey.toString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setWithdrawalRequests(data);
    }
  };

  const createReferralCode = async () => {
    if (!publicKey) return;
    
    const code = newCode.trim().toUpperCase();
    
    if (code.length < 3) {
      toast.error("Referral code must be at least 3 characters");
      return;
    }

    if (!/^[A-Z0-9]+$/.test(code)) {
      toast.error("Referral code can only contain letters and numbers");
      return;
    }

    if (code === "BONUS2025") {
      toast.error("This code is reserved. Please choose a different code.");
      return;
    }

    setLoading(true);

    try {
      const walletAddress = publicKey.toString();

      const { data: existing } = await supabase
        .from("referral_codes")
        .select("wallet_address")
        .eq("code", code)
        .maybeSingle();

      if (existing && existing.wallet_address !== walletAddress) {
        toast.error("This referral code is already taken");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("referral_codes")
        .upsert({
          wallet_address: walletAddress,
          code: code,
        });

      if (error) throw error;

      setReferralCode(code);
      setNewCode("");
      toast.success("Referral code created successfully!");
    } catch (error) {
      console.error("Error creating referral code:", error);
      toast.error("Failed to create referral code");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied to clipboard!");
  };

  const handleWithdraw = async () => {
    if (!publicKey || !wallet) return;

    const pendingSol = pendingLamports / LAMPORTS_PER_SOL;
    
    if (pendingSol < MINIMUM_WITHDRAWAL_SOL) {
      toast.error(`Minimum withdrawal is ${MINIMUM_WITHDRAWAL_SOL} SOL (≈$10). Current: ${pendingSol.toFixed(4)} SOL`);
      return;
    }

    setWithdrawing(true);

    try {
      const message = JSON.stringify({
        action: 'withdraw',
        timestamp: Date.now(),
        wallet: publicKey.toString()
      });

      const messageBytes = new TextEncoder().encode(message);
      
      if (!('signMessage' in wallet.adapter) || typeof wallet.adapter.signMessage !== 'function') {
        throw new Error('Wallet does not support message signing');
      }
      
      const signatureUint8 = await (wallet.adapter as any).signMessage(messageBytes);
      const signature = bs58.encode(signatureUint8);

      const { data, error } = await supabase.functions.invoke("process-withdrawal", {
        body: {
          walletAddress: publicKey.toString(),
          amountLamports: pendingLamports,
          signature,
          message
        },
      });

      if (error) {
        console.error("Withdrawal error:", error);
        toast.error(error.message || "Failed to process withdrawal");
        throw error;
      }

      if (data) {
        toast.success("Withdrawal completed successfully! SOL sent to your wallet.");
      }
      
      // Always reload data after withdrawal attempt
      await loadAllData();
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      // Still reload data even on error to show updated state
      await loadAllData();
    } finally {
      setWithdrawing(false);
    }
  };

  const totalReferrals = referrals.length;
  const totalTicketsPurchased = referrals.reduce((sum, r) => sum + r.tickets_purchased, 0);

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Referral Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Earn 25% commission on all Monthly lottery tickets purchased with your code
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-primary/30 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-orbitron font-bold text-primary">{totalReferrals}</div>
              </CardContent>
            </Card>

            <Card className="border-accent/30 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Tickets Sold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-orbitron font-bold text-accent">{totalTicketsPurchased}</div>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-orbitron font-bold text-primary">
                  {(totalEarnedLamports / LAMPORTS_PER_SOL).toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  SOL {solPrice > 0 && `≈ $${((totalEarnedLamports / LAMPORTS_PER_SOL) * solPrice).toFixed(2)}`}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-orbitron font-bold text-green-500">
                  {(pendingLamports / LAMPORTS_PER_SOL).toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  SOL {solPrice > 0 && `≈ $${((pendingLamports / LAMPORTS_PER_SOL) * solPrice).toFixed(2)}`}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Referral Code Card */}
              <Card className="border-primary/30 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="font-orbitron">Your Referral Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {referralCode ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input 
                          value={referralCode} 
                          readOnly 
                          className="font-mono text-xl bg-background/50 border-primary/30" 
                        />
                        <Button onClick={copyReferralCode} size="icon" className="bg-primary hover:bg-primary/90">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          Share this code with others. When they purchase <strong>Monthly</strong> lottery tickets, you earn <strong>25%</strong> commission!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="newCode" className="text-sm">Create Your Unique Code</Label>
                        <Input
                          id="newCode"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                          placeholder="Enter code (min 3 characters)"
                          maxLength={20}
                          className="bg-background/50 border-primary/30 mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Letters and numbers only. Cannot use "BONUS2025".
                        </p>
                      </div>
                      <Button onClick={createReferralCode} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                        {loading ? "Creating..." : "Create Referral Code"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Withdrawal Card */}
              <Card className="border-green-500/30 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="font-orbitron">Withdraw Earnings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Available Balance:</span>
                      <div className="text-right">
                        <div className="text-xl font-orbitron font-bold text-green-500">
                          {(pendingLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
                        </div>
                        {solPrice > 0 && (
                          <div className="text-sm text-muted-foreground">
                            ≈ ${((pendingLamports / LAMPORTS_PER_SOL) * solPrice).toFixed(2)} USD
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Minimum Withdrawal:</span>
                      <span className="text-sm font-semibold">{MINIMUM_WITHDRAWAL_SOL} SOL (≈$10)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Already Withdrawn:</span>
                      <span className="text-sm font-semibold">{(withdrawnLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleWithdraw}
                    disabled={withdrawing || (pendingLamports / LAMPORTS_PER_SOL) < MINIMUM_WITHDRAWAL_SOL}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    size="lg"
                  >
                    {withdrawing ? "Processing..." : "Request Withdrawal"}
                  </Button>

                  {pendingLamports > 0 && (pendingLamports / LAMPORTS_PER_SOL) < MINIMUM_WITHDRAWAL_SOL && (
                    <p className="text-xs text-center text-muted-foreground">
                      Need {((MINIMUM_WITHDRAWAL_SOL * LAMPORTS_PER_SOL - pendingLamports) / LAMPORTS_PER_SOL).toFixed(4)} more SOL to withdraw
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Withdrawal History */}
              {withdrawalRequests.length > 0 && (
                <Card className="border-primary/30 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="font-orbitron flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Withdrawal History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {withdrawalRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex justify-between items-center p-3 bg-background/50 border border-border rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-sm">
                              {(req.amount_lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(req.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              req.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                              req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Referrals List */}
            <Card className="border-primary/30 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-orbitron">Your Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {referrals.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="font-orbitron text-lg font-semibold mb-2">No referrals yet</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Share your referral code and start earning commission on ticket purchases!
                      </p>
                    </div>
                  ) : (
                    referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex justify-between items-center p-4 bg-background/50 border border-border rounded-lg hover:border-primary/30 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-mono text-sm font-semibold mb-1">
                            {referral.referred_wallet.slice(0, 8)}...
                            {referral.referred_wallet.slice(-6)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-primary font-semibold mt-1">
                            Code: {referral.referral_code}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-orbitron font-bold text-accent">{referral.tickets_purchased}</p>
                          <p className="text-xs text-muted-foreground">tickets</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReferralsV3;
