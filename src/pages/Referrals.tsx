import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import bs58 from "bs58";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Users, Ticket, Wallet } from "lucide-react";

interface Referral {
  id: string;
  referred_wallet: string;
  tickets_purchased: number;
  created_at: string;
}

interface ReferralEarnings {
  total_earned_lamports: number;
  withdrawn_lamports: number;
  pending_lamports: number;
}

const LAMPORTS_PER_SOL = 1000000000;
const MINIMUM_WITHDRAWAL_SOL = 0.05; // ~$10 worth of SOL

const Referrals = () => {
  const { publicKey, wallet } = useWallet();
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<ReferralEarnings | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      navigate("/");
      return;
    }
    loadReferralData();
    loadEarnings();
  }, [publicKey, navigate]);

  const loadEarnings = async () => {
    if (!publicKey) return;

    const { data, error } = await supabase
      .from("referral_earnings")
      .select("*")
      .eq("wallet_address", publicKey.toString())
      .maybeSingle();

    if (!error && data) {
      setEarnings(data);
    }
  };

  const loadReferralData = async () => {
    if (!publicKey) return;

    const walletAddress = publicKey.toString();

    // Load existing referral code
    const { data: codeData } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (codeData) {
      setReferralCode(codeData.code);
    }

    // Load referrals
    const { data: referralData } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_wallet", walletAddress)
      .order("created_at", { ascending: false });

    if (referralData) {
      setReferrals(referralData);
    }
  };

  const createReferralCode = async () => {
    if (!publicKey) return;
    
    const code = newCode.trim().toUpperCase();
    
    // Validation
    if (code.length < 3) {
      toast.error("Referral code must be at least 3 characters");
      return;
    }

    if (!/^[A-Z0-9]+$/.test(code)) {
      toast.error("Referral code can only contain letters and numbers");
      return;
    }

    setLoading(true);

    try {
      const walletAddress = publicKey.toString();

      // Check if code already exists
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

      // Insert or update
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
    if (!publicKey || !wallet || !earnings) return;

    const pendingSol = earnings.pending_lamports / LAMPORTS_PER_SOL;
    
    if (pendingSol < MINIMUM_WITHDRAWAL_SOL) {
      toast.error(`You need at least ${MINIMUM_WITHDRAWAL_SOL} SOL to withdraw. Current balance: ${pendingSol.toFixed(2)} SOL`);
      return;
    }

    setWithdrawing(true);

    try {
      // Create message to sign
      const message = JSON.stringify({
        action: 'withdraw',
        timestamp: Date.now(),
        wallet: publicKey.toString()
      });

      // Request wallet signature to prove ownership
      const messageBytes = new TextEncoder().encode(message);
      
      if (!('signMessage' in wallet.adapter) || typeof wallet.adapter.signMessage !== 'function') {
        throw new Error('Wallet does not support message signing');
      }
      
      const signatureUint8 = await (wallet.adapter as any).signMessage(messageBytes);
      const signature = bs58.encode(signatureUint8);

      const { data, error } = await supabase.functions.invoke("process-withdrawal", {
        body: {
          walletAddress: publicKey.toString(),
          amountLamports: earnings.pending_lamports,
          signature,
          message
        },
      });

      if (error) throw error;

      toast.success(data.message || "Withdrawal request submitted!");
      loadEarnings();
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast.error(error.message || "Failed to process withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const totalReferrals = referrals.length;
  const totalTickets = referrals.reduce((sum, r) => sum + r.tickets_purchased, 0);

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8 relative z-10">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-orbitron text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Referral Program
            </h1>
            <p className="text-muted-foreground">
              Share your referral code and earn 25% of Monthly ticket purchases
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-primary/30 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-orbitron font-bold">{totalReferrals}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-accent/30 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Purchased</p>
                  <p className="text-2xl font-orbitron font-bold">{totalTickets}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-primary/30 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-orbitron font-bold text-primary">
                    {earnings ? (earnings.pending_lamports / LAMPORTS_PER_SOL).toFixed(4) : "0.00"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {earnings ? (earnings.total_earned_lamports / LAMPORTS_PER_SOL).toFixed(4) : "0.00"} SOL
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Referral Code Section */}
              <div className="bg-card border border-primary/30 rounded-xl p-6">
                <h2 className="font-orbitron text-xl font-bold mb-2">Your Referral Code</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {referralCode
                    ? "Share this code to earn 25% commission"
                    : "Create your unique referral code"}
                </p>
                
                {referralCode ? (
                  <div className="flex gap-2">
                    <Input 
                      value={referralCode} 
                      readOnly 
                      className="font-mono text-lg bg-background/50 border-primary/30" 
                    />
                    <Button onClick={copyReferralCode} variant="outline" size="icon" className="border-primary/30">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="newCode" className="text-sm">Create Your Code</Label>
                      <Input
                        id="newCode"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="Enter code (min 3 characters)"
                        maxLength={20}
                        className="bg-background/50 border-primary/30"
                      />
                    </div>
                    <Button onClick={createReferralCode} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                      {loading ? "Creating..." : "Create Code"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Withdrawal Card */}
              {earnings && earnings.pending_lamports > 0 && (
                <div className="bg-card border border-accent/30 rounded-xl p-6">
                  <h2 className="font-orbitron text-xl font-bold mb-2">Withdraw Earnings</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Request withdrawal to your wallet
                  </p>
                  
                  <div className="bg-background/50 rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-bold text-primary">{(earnings.pending_lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Minimum:</span>
                      <span className="font-semibold">{MINIMUM_WITHDRAWAL_SOL} SOL</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleWithdraw}
                    disabled={withdrawing || (earnings.pending_lamports / LAMPORTS_PER_SOL) < MINIMUM_WITHDRAWAL_SOL}
                    className="w-full bg-accent hover:bg-accent/90"
                  >
                    {withdrawing ? "Processing..." : "Request Withdrawal"}
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column - Referrals List */}
            <div className="bg-card border border-primary/30 rounded-xl p-6">
              <h2 className="font-orbitron text-xl font-bold mb-2">Your Referrals</h2>
              <p className="text-sm text-muted-foreground mb-4">
                People who used your referral code
              </p>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {referrals.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">
                      No referrals yet. Share your code!
                    </p>
                  </div>
                ) : (
                  referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex justify-between items-center p-3 bg-background/50 border border-border rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold">
                          {referral.referred_wallet.slice(0, 8)}...
                          {referral.referred_wallet.slice(-6)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{referral.tickets_purchased}</p>
                        <p className="text-xs text-muted-foreground">tickets</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Referrals;
