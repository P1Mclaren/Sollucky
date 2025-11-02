import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const LAMPORTS_PER_SOL = 1000000000;

interface FundSplit {
  id: string;
  transaction_signature: string;
  wallet_address: string;
  referral_code: string | null;
  referral_type: string;
  total_lamports: number;
  creator_funds_lamports: number;
  operator_funds_lamports: number;
  lottery_funds_lamports: number;
  referrer_earnings_lamports: number;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  wallet_address: string;
  amount_lamports: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  transaction_signature: string | null;
}

const Admin = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const [fundSplits, setFundSplits] = useState<FundSplit[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Totals
  const [totalCreatorFunds, setTotalCreatorFunds] = useState(0);
  const [totalOperatorFunds, setTotalOperatorFunds] = useState(0);
  const [totalLotteryFunds, setTotalLotteryFunds] = useState(0);
  const [totalReferrerEarnings, setTotalReferrerEarnings] = useState(0);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (!connected || !publicKey) {
        navigate("/");
        return;
      }

      // Check if user has admin role
      const { data: adminCheck } = await supabase
        .rpc('has_role', { _wallet: publicKey.toString(), _role: 'admin' });

      if (!adminCheck) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchData();
    };

    checkAdminAndFetchData();
  }, [connected, publicKey, navigate]);

  const fetchData = async () => {
    if (!publicKey) return;

    setLoading(true);

    try {
      // Fetch admin data via secure Edge Function
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: {}
      });

      if (error) {
        console.error('Error fetching admin data:', error);
        toast.error("Failed to fetch admin data - Unauthorized");
        navigate('/');
        return;
      }

      const splits = data.fundSplits;
      const withdrawalData = data.withdrawals;

      setFundSplits(splits || []);
      setWithdrawals(withdrawalData || []);
      
      // Calculate totals
      let creatorTotal = 0;
      let operatorTotal = 0;
      let lotteryTotal = 0;
      let referrerTotal = 0;

      splits?.forEach((split: FundSplit) => {
        creatorTotal += Number(split.creator_funds_lamports) / LAMPORTS_PER_SOL;
        operatorTotal += Number(split.operator_funds_lamports) / LAMPORTS_PER_SOL;
        lotteryTotal += Number(split.lottery_funds_lamports) / LAMPORTS_PER_SOL;
        referrerTotal += Number(split.referrer_earnings_lamports) / LAMPORTS_PER_SOL;
      });

      setTotalCreatorFunds(creatorTotal);
      setTotalOperatorFunds(operatorTotal);
      setTotalLotteryFunds(lotteryTotal);
      setTotalReferrerEarnings(referrerTotal);
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  const lamportsToSol = (lamports: number) => {
    return (lamports / LAMPORTS_PER_SOL).toFixed(4);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ParticleBackground />
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ParticleBackground />
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="font-orbitron text-4xl font-bold mb-6 text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Admin Dashboard
        </h1>

        {/* Fund Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-primary/30 rounded-xl p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Creator Funds</h3>
            <p className="font-orbitron text-2xl font-bold text-primary mb-1">{totalCreatorFunds.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">30% from creator codes</p>
          </div>

          <div className="bg-card border border-accent/30 rounded-xl p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Operator Funds</h3>
            <p className="font-orbitron text-2xl font-bold text-accent mb-1">{totalOperatorFunds.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">30% from BONUS2025</p>
          </div>

          <div className="bg-card border border-primary/30 rounded-xl p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Lottery Funds</h3>
            <p className="font-orbitron text-2xl font-bold text-primary mb-1">{totalLotteryFunds.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">70% of all purchases</p>
          </div>

          <div className="bg-card border border-accent/30 rounded-xl p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Referrer Earnings</h3>
            <p className="font-orbitron text-2xl font-bold text-accent mb-1">{totalReferrerEarnings.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">25% to referrers</p>
          </div>
        </div>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <div className="bg-card border border-primary/30 rounded-xl p-6">
              <h2 className="font-orbitron text-xl font-bold mb-4">All Ticket Purchases</h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Wallet</TableHead>
                      <TableHead className="text-xs">Code</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Total</TableHead>
                      <TableHead className="text-xs">Creator</TableHead>
                      <TableHead className="text-xs">Operator</TableHead>
                      <TableHead className="text-xs">Lottery</TableHead>
                      <TableHead className="text-xs">Referrer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundSplits.map((split) => (
                      <TableRow key={split.id} className="border-border/50 hover:bg-primary/5">
                        <TableCell className="text-xs">{new Date(split.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">{split.wallet_address.slice(0, 6)}...</TableCell>
                        <TableCell className="text-xs">{split.referral_code || "-"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={split.referral_type === "creator" ? "default" : split.referral_type === "operator" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {split.referral_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{lamportsToSol(split.total_lamports)}</TableCell>
                        <TableCell className="text-xs text-primary">{lamportsToSol(split.creator_funds_lamports)}</TableCell>
                        <TableCell className="text-xs text-accent">{lamportsToSol(split.operator_funds_lamports)}</TableCell>
                        <TableCell className="text-xs text-primary">{lamportsToSol(split.lottery_funds_lamports)}</TableCell>
                        <TableCell className="text-xs text-accent">{lamportsToSol(split.referrer_earnings_lamports)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="withdrawals">
            <div className="bg-card border border-accent/30 rounded-xl p-6">
              <h2 className="font-orbitron text-xl font-bold mb-4">Withdrawal Requests</h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Wallet</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Processed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id} className="border-border/50 hover:bg-accent/5">
                        <TableCell className="text-xs">{new Date(withdrawal.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">{withdrawal.wallet_address.slice(0, 6)}...</TableCell>
                        <TableCell className="text-xs font-semibold">{lamportsToSol(withdrawal.amount_lamports)} SOL</TableCell>
                        <TableCell>
                          <Badge 
                            variant={withdrawal.status === "pending" ? "outline" : withdrawal.status === "completed" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{withdrawal.processed_at ? new Date(withdrawal.processed_at).toLocaleDateString() : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Admin;
