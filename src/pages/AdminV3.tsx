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
import { Play, Square, RotateCcw, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleToggleTestMode = async (enabled: boolean) => {
    setPendingTestModeState(enabled);
    setShowConfirmDialog(true);
  };

  const confirmToggleTestMode = async () => {
    if (!publicKey) return;

    try {
      const { data, error } = await supabase.functions.invoke('toggle-test-mode', {
        body: {
          adminWallet: publicKey.toString(),
          isEnabled: pendingTestModeState,
        },
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
        description: 'Failed to toggle test mode',
        variant: 'destructive',
      });
    } finally {
      setShowConfirmDialog(false);
    }
  };

  const handleStartTest = async (lotteryType: string) => {
    if (!publicKey) return;

    try {
      const { error } = await supabase.functions.invoke('control-test-lottery', {
        body: {
          adminWallet: publicKey.toString(),
          lotteryType,
          action: 'start',
          durationMinutes: testDuration,
        },
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
        description: error.message || 'Failed to start test',
        variant: 'destructive',
      });
    }
  };

  const handleStopTest = async (lotteryType: string) => {
    if (!publicKey) return;

    try {
      const { error } = await supabase.functions.invoke('control-test-lottery', {
        body: {
          adminWallet: publicKey.toString(),
          lotteryType,
          action: 'stop',
        },
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
        description: 'Failed to stop test',
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
      const { error } = await supabase.functions.invoke('reset-test-data', {
        body: {
          adminWallet: publicKey.toString(),
        },
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
        description: 'Failed to reset test data',
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
            Admin Control Panel v3.0
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
              <div className="pt-2 border-t border-border">
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