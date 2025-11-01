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
const MINIMUM_WITHDRAWAL_SOL = 10;

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
      
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Referral Program</h1>
            <p className="text-muted-foreground">
              Share your referral code and earn 25% of ticket purchases
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReferrals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets from Referrals</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTickets}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earnings Available</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {earnings ? (earnings.pending_lamports / LAMPORTS_PER_SOL).toFixed(2) : "0.00"} SOL
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total earned: {earnings ? (earnings.total_earned_lamports / LAMPORTS_PER_SOL).toFixed(2) : "0.00"} SOL
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal Card */}
          {earnings && earnings.pending_lamports > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Withdraw Earnings</CardTitle>
                <CardDescription>Request a withdrawal to your wallet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Available balance: {(earnings.pending_lamports / LAMPORTS_PER_SOL).toFixed(2)} SOL
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Minimum withdrawal: {MINIMUM_WITHDRAWAL_SOL} SOL
                  </p>
                </div>
                <Button 
                  onClick={handleWithdraw}
                  disabled={withdrawing || (earnings.pending_lamports / LAMPORTS_PER_SOL) < MINIMUM_WITHDRAWAL_SOL}
                  className="w-full md:w-auto"
                >
                  {withdrawing ? "Processing..." : "Request Withdrawal"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Referral Code Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
              <CardDescription>
                {referralCode
                  ? "Share this code with others to earn 25% of their ticket purchases"
                  : "Create your unique referral code"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {referralCode ? (
                <div className="flex gap-2">
                  <Input value={referralCode} readOnly className="font-mono text-lg" />
                  <Button onClick={copyReferralCode} variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newCode">Create Your Code</Label>
                    <Input
                      id="newCode"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (min 3 characters)"
                      maxLength={20}
                    />
                  </div>
                  <Button onClick={createReferralCode} disabled={loading}>
                    {loading ? "Creating..." : "Create Code"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referrals List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>People who used your referral code</CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No referrals yet. Share your code to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-mono text-sm">
                          {referral.referred_wallet.slice(0, 8)}...
                          {referral.referred_wallet.slice(-6)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{referral.tickets_purchased} tickets</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Referrals;
