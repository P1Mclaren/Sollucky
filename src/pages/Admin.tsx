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

const ADMIN_WALLET = "HJJEjQRRzCkx7B9j8JABQjTxn7dDCnMdZLnynDLN3if5";
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

  // Totals
  const [totalCreatorFunds, setTotalCreatorFunds] = useState(0);
  const [totalOperatorFunds, setTotalOperatorFunds] = useState(0);
  const [totalLotteryFunds, setTotalLotteryFunds] = useState(0);
  const [totalReferrerEarnings, setTotalReferrerEarnings] = useState(0);

  useEffect(() => {
    if (!connected || !publicKey) {
      navigate("/");
      return;
    }

    if (publicKey.toString() !== ADMIN_WALLET) {
      navigate("/");
      return;
    }

    fetchData();
  }, [connected, publicKey, navigate]);

  const fetchData = async () => {
    if (!publicKey) return;

    setLoading(true);

    try {
      // Fetch admin data via secure Edge Function
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { walletAddress: publicKey.toString() }
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
      
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Admin Dashboard
        </h1>

        {/* Fund Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Creator Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalCreatorFunds.toFixed(2)} SOL</p>
              <p className="text-xs text-muted-foreground">30% from creator codes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Operator Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-secondary">{totalOperatorFunds.toFixed(2)} SOL</p>
              <p className="text-xs text-muted-foreground">30% from BONUS2025</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Lottery Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">{totalLotteryFunds.toFixed(2)} SOL</p>
              <p className="text-xs text-muted-foreground">70% of all purchases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Referrer Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">{totalReferrerEarnings.toFixed(2)} SOL</p>
              <p className="text-xs text-muted-foreground">25% to referrers</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>All Ticket Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Lottery</TableHead>
                        <TableHead>Referrer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundSplits.map((split) => (
                        <TableRow key={split.id}>
                          <TableCell>{new Date(split.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs">{split.wallet_address.slice(0, 8)}...</TableCell>
                          <TableCell>{split.referral_code || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={split.referral_type === "creator" ? "default" : split.referral_type === "operator" ? "secondary" : "outline"}>
                              {split.referral_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{lamportsToSol(split.total_lamports)} SOL</TableCell>
                          <TableCell className="text-primary">{lamportsToSol(split.creator_funds_lamports)} SOL</TableCell>
                          <TableCell className="text-secondary">{lamportsToSol(split.operator_funds_lamports)} SOL</TableCell>
                          <TableCell className="text-accent">{lamportsToSol(split.lottery_funds_lamports)} SOL</TableCell>
                          <TableCell className="text-green-500">{lamportsToSol(split.referrer_earnings_lamports)} SOL</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>{new Date(withdrawal.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs">{withdrawal.wallet_address.slice(0, 8)}...</TableCell>
                          <TableCell>{lamportsToSol(withdrawal.amount_lamports)} SOL</TableCell>
                          <TableCell>
                            <Badge variant={withdrawal.status === "pending" ? "outline" : withdrawal.status === "completed" ? "default" : "destructive"}>
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{withdrawal.processed_at ? new Date(withdrawal.processed_at).toLocaleDateString() : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Admin;
