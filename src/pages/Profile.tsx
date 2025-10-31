import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Wallet, TrendingUp, Ticket, Clock, ArrowDownToLine } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [preOrderTickets, setPreOrderTickets] = useState(0);
  const [transactions, setTransactions] = useState<Array<{date: string, type: string, amount: string, status: string}>>([]);

  // Load wallet-specific data from localStorage
  useEffect(() => {
    if (publicKey) {
      const walletAddress = publicKey.toString();
      const storedTickets = localStorage.getItem(`sollucky_tickets_${walletAddress}`);
      const storedTxs = localStorage.getItem(`sollucky_txs_${walletAddress}`);
      
      if (storedTickets) setPreOrderTickets(parseInt(storedTickets));
      if (storedTxs) setTransactions(JSON.parse(storedTxs));
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
    }
  }, [connected, publicKey]);

  const fetchBalance = async () => {
    if (!publicKey) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleDeposit = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    toast.success(`Deposited ${amount} SOL`, {
      description: 'Your deposit has been processed',
    });
    
    setDepositAmount('');
    fetchBalance();
  };

  const handlePreOrder = () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter an amount to pre-order');
      return;
    }

    // Calculate tickets (2× bonus, $1 per ticket at ~$170/SOL = ~170 tickets per SOL)
    const ticketsFromAmount = Math.floor(amount * 170 * 2);
    const newTotal = preOrderTickets + ticketsFromAmount;
    
    if (newTotal > 250) {
      toast.error('Maximum 250 pre-order tickets allowed');
      return;
    }

    const walletAddress = publicKey.toString();
    const newTransaction = {
      date: new Date().toISOString().split('T')[0],
      type: 'Pre-Order',
      amount: `-${amount} SOL`,
      status: 'Confirmed'
    };
    
    const updatedTxs = [newTransaction, ...transactions];
    
    // Store data linked to wallet address
    localStorage.setItem(`sollucky_tickets_${walletAddress}`, newTotal.toString());
    localStorage.setItem(`sollucky_txs_${walletAddress}`, JSON.stringify(updatedTxs));
    
    setPreOrderTickets(newTotal);
    setTransactions(updatedTxs);
    
    toast.success(`Pre-ordered ${ticketsFromAmount} tickets (2× bonus)`, {
      description: `Total pre-orders: ${newTotal}/250`,
    });
    
    setDepositAmount('');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4 text-glow-purple">
            Wallet Profile
          </h1>
          {connected && publicKey && (
            <p className="text-sm text-muted-foreground mb-8">
              Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </p>
          )}

          {/* Wallet Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-primary/30 p-6 shadow-neon">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-bold text-primary">
                    {connected ? `${balance.toFixed(4)} SOL` : 'Not Connected'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-accent/30 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pre-Order Tickets</p>
                  <p className="text-2xl font-bold text-accent">
                    {preOrderTickets}/250
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border/50 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Clock className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platform Launch</p>
                  <p className="text-2xl font-bold text-accent">Coming Soon</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Deposit & Pre-Order */}
            <Card className="bg-card border-primary/30 p-8 shadow-neon">
              <h2 className="font-orbitron text-2xl font-bold mb-6 flex items-center gap-2">
                <ArrowDownToLine className="w-6 h-6 text-primary" />
                Deposit & Pre-Order
              </h2>

              {connected ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (SOL)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="bg-background border-border focus:border-primary"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <p className="text-sm mb-2">
                      <strong className="text-primary">2× Ticket Bonus</strong> for Monthly lottery pre-orders
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pre-ordering now gives you double tickets when the platform launches (max 250 total)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={handleDeposit}
                      variant="outline"
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      Deposit Only
                    </Button>
                    <Button
                      onClick={handlePreOrder}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-neon"
                    >
                      Pre-Order Tickets
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    When the platform launches, all draws and payouts will run automatically via Solana smart contracts
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Connect your wallet to deposit SOL and pre-order tickets
                  </p>
                  <p className="text-sm text-accent">
                    Use the "Connect Wallet" button in the top navigation
                  </p>
                </div>
              )}
            </Card>

            {/* Transaction History */}
            <Card className="bg-card border-border/50 p-8">
              <h2 className="font-orbitron text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-foreground" />
                Transaction History
              </h2>

              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.amount.startsWith('+') ? 'text-accent' : 'text-foreground'}`}>
                          {tx.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions yet. Pre-order tickets to get started.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Info Notice */}
          <Card className="mt-8 bg-secondary/20 border-primary/30 p-6">
            <p className="text-center text-muted-foreground">
              <strong className="text-primary">Waitlist Mode:</strong> This is a pre-launch interface. All pre-order data is stored locally in your browser and linked to your wallet address. When the platform launches, all transactions will be processed through Solana smart contracts with full transparency and security.
            </p>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
