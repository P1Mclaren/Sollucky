import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTestMode } from '@/contexts/TestModeContext';
import { Play, Square, RotateCcw, Activity, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LAMPORTS_PER_SOL = 1000000000;

interface TestLotteryRun {
  id: string;
  lottery_type: string;
  status: string;
  started_at: string | null;
  stopped_at: string | null;
  duration_minutes: number;
}

interface AuditLog {
  id: string;
  action_type: string;
  action_details: any;
  admin_wallet: string;
  created_at: string;
}

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

export default function AdminV3() {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isTestMode, refreshTestMode } = useTestMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testRuns, setTestRuns] = useState<TestLotteryRun[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTestModeState, setPendingTestModeState] = useState(false);
  const [testDuration, setTestDuration] = useState(5);
  
  // Financial dashboard state
  const [fundSplits, setFundSplits] = useState<FundSplit[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [totalCreatorFunds, setTotalCreatorFunds] = useState(0);
  const [totalOperatorFunds, setTotalOperatorFunds] = useState(0);
  const [totalLotteryFunds, setTotalLotteryFunds] = useState(0);
  const [totalReferrerEarnings, setTotalReferrerEarnings] = useState(0);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!publicKey) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _wallet: publicKey.toString(),
          _role: 'admin',
        });

        if (error) throw error;

        if (!data) {
          navigate('/');
          return;
        }

        setIsAdmin(true);
        fetchData();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [publicKey, navigate]);

  const fetchData = async () => {
    try {
      // Fetch test lottery runs
      const { data: runs, error: runsError } = await supabase
        .from('test_lottery_runs')
        .select('*')
        .order('created_at', { ascending: false });

      if (runsError) throw runsError;
      setTestRuns(runs || []);

      // Fetch audit logs
      const { data: logs } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setAuditLogs(logs || []);

      // Fetch financial data
      await fetchAdminData();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAdminData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: {}
      });

      if (error) {
        console.error('Error fetching admin data:', error);
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
      console.error('Error in fetchAdminData:', error);
    }
  };

  const lamportsToSol = (lamports: number) => {
    return (lamports / LAMPORTS_PER_SOL).toFixed(4);
  };

  const handleToggleTestMode = async (enabled: boolean) => {
    setPendingTestModeState(enabled);
    setShowConfirmDialog(true);
  };

  const confirmToggleTestMode = async () => {
    if (!publicKey) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please reconnect your wallet to perform admin actions.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('toggle-test-mode', {
        body: {
          isEnabled: pendingTestModeState,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      await refreshTestMode();
      await fetchData();

      toast({
        title: pendingTestModeState ? 'Test Mode Enabled' : 'Test Mode Disabled',
        description: pendingTestModeState
          ? 'All operations now use DEVNET'
          : 'Switched back to production',
      });
    } catch (error) {
      console.error('Error toggling test mode:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle test mode',
        variant: 'destructive',
      });
    } finally {
      setShowConfirmDialog(false);
    }
  };

  const handleStartTest = async (lotteryType: string) => {
    if (!publicKey) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please reconnect your wallet to perform admin actions.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.functions.invoke('control-test-lottery', {
        body: {
          lotteryType,
          action: 'start',
          durationMinutes: testDuration,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      await fetchData();

      toast({
        title: 'Test Started',
        description: `${lotteryType} test lottery is now running`,
      });
    } catch (error) {
      console.error('Error starting test:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start test',
        variant: 'destructive',
      });
    }
  };

  const handleStopTest = async (lotteryType: string) => {
    if (!publicKey) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please reconnect your wallet to perform admin actions.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.functions.invoke('control-test-lottery', {
        body: {
          lotteryType,
          action: 'stop',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      await fetchData();

      toast({
        title: 'Test Stopped',
        description: `${lotteryType} test lottery has been stopped`,
      });
    } catch (error) {
      console.error('Error stopping test:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to stop test',
        variant: 'destructive',
      });
    }
  };

  const handleResetTestData = async () => {
    if (!publicKey) return;

    if (!confirm('Are you sure you want to reset all test data? This cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please reconnect your wallet to perform admin actions.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.functions.invoke('reset-test-data', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      await fetchData();

      toast({
        title: 'Test Data Reset',
        description: 'All test data has been cleared',
      });
    } catch (error) {
      console.error('Error resetting test data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset test data',
        variant: 'destructive',
      });
    }
  };

  const handleInitializeDraws = async () => {
    if (!publicKey) return;

    if (!confirm('Initialize lottery draws? This will create the initial monthly, weekly, and daily draws.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please reconnect your wallet to perform admin actions.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('initialize-draws', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: 'Draws Initialized',
        description: `Successfully created ${data?.draws?.length || 0} lottery draws`,
      });

      await fetchData();
    } catch (error) {
      console.error('Error initializing draws:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initialize draws',
        variant: 'destructive',
      });
    }
  };

  const getLotteryStatus = (lotteryType: string) => {
    const run = testRuns.find(
      (r) => r.lottery_type === lotteryType && r.status === 'RUNNING'
    );
    return run ? 'RUNNING' : 'IDLE';
  };

  const getTimeRemaining = (lotteryType: string) => {
    const run = testRuns.find(
      (r) => r.lottery_type === lotteryType && r.status === 'RUNNING'
    );

    if (!run || !run.started_at) return null;

    const startTime = new Date(run.started_at).getTime();
    const endTime = startTime + run.duration_minutes * 60 * 1000;
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const lotteryTypes = ['monthly', 'weekly', 'daily'];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage test mode and lottery testing operations
          </p>
        </div>

        {/* Global Test Mode Toggle */}
        <Card className="mb-6 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Global Test Mode
              </span>
              <Badge variant={isTestMode ? 'default' : 'outline'}>
                {isTestMode ? 'DEVNET' : 'PRODUCTION'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border">
              <div className="space-y-1">
                <p className="font-medium">Test Mode Switch</p>
                <p className="text-xs text-muted-foreground">
                  Toggle between production and devnet environments
                </p>
              </div>
              <Switch
                checked={isTestMode}
                onCheckedChange={handleToggleTestMode}
                className="data-[state=checked]:bg-yellow-500"
              />
            </div>

            {isTestMode && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-200">
                  ⚠️ Test mode is active. All operations use DEVNET and test data namespace.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-Lottery Controls */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {lotteryTypes.map((type) => {
            const status = getLotteryStatus(type);
            const timeRemaining = getTimeRemaining(type);

            return (
              <Card key={type} className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base capitalize flex items-center justify-between">
                    {type} Lottery
                    <Badge
                      variant={status === 'RUNNING' ? 'default' : 'outline'}
                      className={status === 'RUNNING' ? 'bg-green-500' : ''}
                    >
                      {status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {status === 'RUNNING' && timeRemaining && (
                    <div className="text-center py-2 bg-primary/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                      <p className="text-xl font-mono font-bold text-primary">{timeRemaining}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => handleStartTest(type)}
                      disabled={!isTestMode || status === 'RUNNING'}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Start Test
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleStopTest(type)}
                      disabled={status !== 'RUNNING'}
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  </div>

                  {!isTestMode && (
                    <p className="text-xs text-muted-foreground text-center">
                      Enable test mode to run tests
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Test Duration Control */}
        {isTestMode && (
          <Card className="mb-6 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm">Test Duration (minutes):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={testDuration}
                  onChange={(e) => setTestDuration(parseInt(e.target.value) || 5)}
                  className="w-20 px-3 py-1 bg-background border border-border rounded-md text-sm"
                />
              </div>
              <div className="pt-2 border-t border-border space-y-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleResetTestData}
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All Test Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Production Controls */}
        {!isTestMode && (
          <Card className="mb-6 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Production Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="default"
                size="sm"
                onClick={handleInitializeDraws}
                className="w-full"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Initialize Lottery Draws
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Creates the initial monthly, weekly, and daily lottery draws. Only run this once at launch.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Financial Overview */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Financial Overview
          </h2>
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
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">All Ticket Purchases</CardTitle>
                </CardHeader>
                <CardContent>
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
                        {fundSplits.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                              No transactions yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          fundSplits.map((split) => (
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
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card className="border-accent/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Withdrawal Requests</CardTitle>
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
                        {withdrawals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                              No withdrawal requests yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          withdrawals.map((withdrawal) => (
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
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Audit Log */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No audit logs yet
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-card/50 rounded-lg border border-border text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-primary">{log.action_type}</span>
                      <span className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Admin: {log.admin_wallet.slice(0, 8)}...{log.admin_wallet.slice(-4)}
                    </p>
                    {log.action_details && (
                      <pre className="mt-1 text-muted-foreground">
                        {JSON.stringify(log.action_details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingTestModeState ? 'Enable Test Mode?' : 'Disable Test Mode?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTestModeState ? (
                <>
                  You are switching to <strong>DEVNET</strong>. No real funds will move.
                  Production schedules are unaffected. All operations will use test data.
                </>
              ) : (
                <>
                  You are switching to <strong>PRODUCTION</strong>. All operations will use
                  real funds and production data.
                  {testRuns.some((r) => r.status === 'RUNNING') && (
                    <span className="block mt-2 text-yellow-500">
                      ⚠️ Active test runs will be stopped.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleTestMode}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}