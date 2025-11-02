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

interface LotteryFundBalance {
  id: string;
  lottery_type: string;
  draw_id: string;
  total_collected_lamports: number;
  lottery_pool_lamports: number;
  operator_share_lamports: number;
  creator_share_lamports: number;
  referrer_share_lamports: number;
  paid_to_winners_lamports: number;
  created_at: string;
  updated_at: string;
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

const AdminV3 = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Per-lottery balances
  const [dailyBalance, setDailyBalance] = useState<LotteryFundBalance | null>(null);
  const [weeklyBalance, setWeeklyBalance] = useState<LotteryFundBalance | null>(null);
  const [monthlyBalance, setMonthlyBalance] = useState<LotteryFundBalance | null>(null);
  
  // Historical data
  const [allBalances, setAllBalances] = useState<LotteryFundBalance[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (!connected || !publicKey) {
        navigate("/");
        return;
      }

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

  useEffect(() => {
    if (!isAdmin) return;

    // Set up realtime subscriptions for instant updates
    const balancesChannel = supabase
      .channel('lottery-fund-balances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lottery_fund_balances'
        },
        () => {
          console.log('Fund balances updated, reloading...');
          fetchData();
        }
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('withdrawal-requests-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests'
        },
        () => {
          console.log('Withdrawals updated, reloading...');
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(balancesChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, [isAdmin]);

  const fetchData = async () => {
    if (!publicKey) return;

    setLoading(true);

    try {
      // Fetch all lottery fund balances
      const { data: balances, error: balancesError } = await supabase
        .from('lottery_fund_balances')
        .select('*')
        .order('created_at', { ascending: false });

      if (balancesError) throw balancesError;

      setAllBalances(balances || []);

      // Get the most recent balance for each lottery type
      const daily = balances?.find(b => b.lottery_type === 'daily');
      const weekly = balances?.find(b => b.lottery_type === 'weekly');
      const monthly = balances?.find(b => b.lottery_type === 'monthly');

      setDailyBalance(daily || null);
      setWeeklyBalance(weekly || null);
      setMonthlyBalance(monthly || null);

      await fetchWithdrawals();
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!withdrawalError && withdrawalData) {
      setWithdrawals(withdrawalData);
    }
  };

  const lamportsToSol = (lamports: number) => {
    return (lamports / LAMPORTS_PER_SOL).toFixed(4);
  };

  const lamportsToUsd = (lamports: number, solPriceUsd: number = 200) => {
    const sol = lamports / LAMPORTS_PER_SOL;
    return (sol * solPriceUsd).toFixed(2);
  };

  const renderLotteryCard = (
    title: string,
    balance: LotteryFundBalance | null,
    showCreatorAndReferrer: boolean = false
  ) => {
    if (!balance) {
      return (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No data available yet</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="font-orbitron text-xl">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Updated: {new Date(balance.updated_at).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Lottery Pool (70%)</p>
              <p className="font-orbitron text-lg font-bold text-primary">
                {lamportsToSol(balance.lottery_pool_lamports)} SOL
              </p>
              <p className="text-xs text-muted-foreground">≈${lamportsToUsd(balance.lottery_pool_lamports)}</p>
            </div>

            <div className="bg-accent/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Operator Share (30%)</p>
              <p className="font-orbitron text-lg font-bold text-accent">
                {lamportsToSol(balance.operator_share_lamports)} SOL
              </p>
              <p className="text-xs text-muted-foreground">≈${lamportsToUsd(balance.operator_share_lamports)}</p>
            </div>

            {showCreatorAndReferrer && (
              <>
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Creator Share (30%)</p>
                  <p className="font-orbitron text-lg font-bold text-primary">
                    {lamportsToSol(balance.creator_share_lamports)} SOL
                  </p>
                  <p className="text-xs text-muted-foreground">≈${lamportsToUsd(balance.creator_share_lamports)}</p>
                </div>

                <div className="bg-accent/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Referrer Earnings (25%)</p>
                  <p className="font-orbitron text-lg font-bold text-accent">
                    {lamportsToSol(balance.referrer_share_lamports)} SOL
                  </p>
                  <p className="text-xs text-muted-foreground">≈${lamportsToUsd(balance.referrer_share_lamports)}</p>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-border/50 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Collected:</span>
              <span className="font-semibold">{lamportsToSol(balance.total_collected_lamports)} SOL</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid to Winners:</span>
              <span className="font-semibold text-primary">{lamportsToSol(balance.paid_to_winners_lamports)} SOL</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining in Pool:</span>
              <span className="font-semibold text-accent">
                {lamportsToSol(balance.lottery_pool_lamports - balance.paid_to_winners_lamports)} SOL
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
          Admin Dashboard V3
        </h1>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="current">Current Balances</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {/* Monthly Lottery - with creator and referrer */}
            {renderLotteryCard("Monthly Lottery", monthlyBalance, true)}
            
            {/* Weekly Lottery - only lottery pool and operator */}
            {renderLotteryCard("Weekly Lottery", weeklyBalance, false)}
            
            {/* Daily Lottery - only lottery pool and operator */}
            {renderLotteryCard("Daily Lottery", dailyBalance, false)}
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="font-orbitron">Fund Balance History</CardTitle>
                <p className="text-sm text-muted-foreground">Historical view of all lottery fund distributions</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Total Collected</TableHead>
                        <TableHead className="text-xs">Lottery Pool</TableHead>
                        <TableHead className="text-xs">Operator</TableHead>
                        <TableHead className="text-xs">Creator</TableHead>
                        <TableHead className="text-xs">Referrer</TableHead>
                        <TableHead className="text-xs">Paid Out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBalances.map((balance) => (
                        <TableRow key={balance.id} className="border-border/50 hover:bg-primary/5">
                          <TableCell className="text-xs">{new Date(balance.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {balance.lottery_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{lamportsToSol(balance.total_collected_lamports)}</TableCell>
                          <TableCell className="text-xs text-primary">{lamportsToSol(balance.lottery_pool_lamports)}</TableCell>
                          <TableCell className="text-xs text-accent">{lamportsToSol(balance.operator_share_lamports)}</TableCell>
                          <TableCell className="text-xs text-primary">{lamportsToSol(balance.creator_share_lamports)}</TableCell>
                          <TableCell className="text-xs text-accent">{lamportsToSol(balance.referrer_share_lamports)}</TableCell>
                          <TableCell className="text-xs text-primary">{lamportsToSol(balance.paid_to_winners_lamports)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="font-orbitron">Withdrawal Requests</CardTitle>
                <p className="text-sm text-muted-foreground">All referral earnings withdrawals</p>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminV3;
