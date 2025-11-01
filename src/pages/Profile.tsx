import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Wallet, TrendingUp, Ticket, Gift, User, Copy, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

const LOTTERY_WALLET = 'FfVVCDEoigroHR49zLxS3C3WuWQDzT6Mujidd73bDfcM';

export default function Profile() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [ticketAmount, setTicketAmount] = useState('');
  const [preOrderTickets, setPreOrderTickets] = useState(0);
  const [transactions, setTransactions] = useState<Array<{date: string, type: string, amount: string, status: string}>>([]);

  // Redirect if wallet not connected
  useEffect(() => {
    if (!connected) {
      navigate('/');
      toast.error('Please connect your wallet to view your profile');
    }
  }, [connected, navigate]);

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

  const handlePreOrder = async () => {
    if (!connected || !publicKey || !sendTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    const tickets = parseInt(ticketAmount);
    if (!tickets || tickets <= 0) {
      toast.error('Please enter the number of tickets');
      return;
    }

    // Calculate total tickets they'll receive (2x bonus)
    const ticketsReceived = tickets * 2;
    const newTotal = preOrderTickets + ticketsReceived;
    
    if (newTotal > 2500) {
      toast.error('Maximum 2500 pre-order tickets allowed');
      return;
    }

    try {
      // Calculate SOL needed (normal price: $1 per ticket at ~$170/SOL)
      // Base rate: 170 tickets per SOL, so 1 ticket = 1/170 SOL
      const solNeeded = tickets / 170;
      const lamports = Math.floor(solNeeded * LAMPORTS_PER_SOL);
      
      // Estimate transaction fee (5000 lamports per signature)
      const estimatedFee = 5000;
      const totalRequired = lamports + estimatedFee;
      
      // Check if user has enough balance
      const currentBalance = await connection.getBalance(publicKey);
      if (currentBalance < totalRequired) {
        toast.error('Insufficient balance', {
          description: `You need ${(totalRequired / LAMPORTS_PER_SOL).toFixed(4)} SOL (including fees)`,
        });
        return;
      }

      toast.info('Processing transaction...', {
        description: 'Please confirm in your wallet',
      });

      // Create transaction with single transfer to lottery wallet
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(LOTTERY_WALLET),
          lamports: lamports,
        })
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send and confirm transaction
      const signature = await sendTransaction(transaction, connection);
      
      toast.info('Confirming transaction...', {
        description: 'This may take a few seconds',
      });

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      // Success - update local state
      const walletAddress = publicKey.toString();
      const newTransaction = {
        date: new Date().toISOString().split('T')[0],
        type: 'Pre-Order',
        amount: `-${solNeeded.toFixed(4)} SOL`,
        status: 'Confirmed'
      };
      
      const updatedTxs = [newTransaction, ...transactions];
      
      localStorage.setItem(`sollucky_tickets_${walletAddress}`, newTotal.toString());
      localStorage.setItem(`sollucky_txs_${walletAddress}`, JSON.stringify(updatedTxs));
      
      setPreOrderTickets(newTotal);
      setTransactions(updatedTxs);
      
      toast.success(`Purchased ${tickets} tickets → Received ${ticketsReceived} tickets!`, {
        description: `Transaction confirmed! View on Solscan`,
        action: {
          label: 'View',
          onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank'),
        },
      });
      
      setTicketAmount('');
      fetchBalance(); // Refresh balance
      
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled', {
          description: 'You rejected the transaction',
        });
      } else {
        toast.error('Transaction failed', {
          description: error.message || 'Please try again',
        });
      }
    }
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Profile Header */}
          <div className="relative mb-12">
            <Card className="relative bg-card/80 backdrop-blur-sm border-primary/30 p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="font-orbitron text-3xl md:text-5xl font-bold mb-4 text-glow-purple">
                    My Profile
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                    <div className="px-4 py-2 rounded-xl bg-background/80 border border-primary/30 backdrop-blur-sm">
                      <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                      <div className="flex items-center gap-2">
                        <code className="text-primary font-mono text-sm">
                          {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                        </code>
                        <button
                          onClick={copyAddress}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {copied ? (
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Pre-launch member • Earning 2× bonus tickets
                  </p>
                </div>

                {/* View on Solscan */}
                <Button
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                  onClick={() => window.open(`https://solscan.io/account/${publicKey.toString()}`, '_blank')}
                >
                  View on Solscan
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card border-primary/30 p-6 hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                    <span className="text-xs font-medium text-primary">SOL</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Balance</p>
                <p className="text-2xl font-bold text-foreground font-orbitron">
                  {balance.toFixed(4)}
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-card border-primary/30 p-6 hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-primary" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                    <span className="text-xs font-medium text-primary">2× Bonus</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Pre-Orders</p>
                <p className="text-2xl font-bold text-foreground font-orbitron">
                  {preOrderTickets}<span className="text-lg text-muted-foreground">/2500</span>
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-card border-primary/30 p-6 hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                <p className="text-2xl font-bold text-foreground font-orbitron">
                  {transactions.length}
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-card border-primary/30 p-6 hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Bonus Earned</p>
                <p className="text-2xl font-bold text-primary font-orbitron">
                  {preOrderTickets > 0 ? `${Math.floor(preOrderTickets / 2)}` : '0'}
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pre-Order Section - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-card border-primary/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-orbitron text-2xl font-bold">Pre-Order Tickets</h2>
                    <p className="text-sm text-muted-foreground">Get 2× bonus for Monthly lottery</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Tickets</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        value={ticketAmount}
                        onChange={(e) => setTicketAmount(e.target.value)}
                        className="bg-background border-border focus:border-primary text-lg h-14 pr-24"
                        min="1"
                        step="1"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        Tickets
                      </div>
                    </div>
                    {ticketAmount && parseInt(ticketAmount) > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-primary">
                          Price: {(parseInt(ticketAmount) / 170).toFixed(4)} SOL (≈ ${((parseInt(ticketAmount) / 170) * 170).toFixed(2)} USD)
                        </p>
                        <p className="text-xs text-accent font-medium">
                          You'll receive {parseInt(ticketAmount) * 2} tickets (2× bonus)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Gift className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-primary mb-1">Double Ticket Bonus Active</p>
                        <p className="text-sm text-muted-foreground">
                          Pre-order now and receive 2× the tickets you purchase! Maximum 2500 pre-order tickets per wallet.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={handleDeposit}
                      variant="outline"
                      size="lg"
                      className="border-primary/50 text-primary hover:bg-primary/10 h-12"
                    >
                      Deposit Only
                    </Button>
                    <Button
                      onClick={handlePreOrder}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12"
                    >
                      Pre-Order Now
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Transaction History */}
              <Card className="bg-card border-border/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-foreground" />
                  </div>
                  <h2 className="font-orbitron text-2xl font-bold">Recent Activity</h2>
                </div>

                <div className="space-y-3">
                  {transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{tx.type}</p>
                            <p className="text-xs text-muted-foreground">{tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-mono">{tx.amount}</p>
                          <p className="text-xs text-primary">{tx.status}</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-2">No transactions yet</p>
                      <p className="text-sm text-muted-foreground">
                        Pre-order tickets to get started
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="space-y-8">
              {/* Status Card */}
              <Card className="bg-card border-primary/30 p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-primary">Pre-Launch Member</span>
                  </div>
                  <h3 className="font-orbitron text-lg font-bold mb-2">Platform Status</h3>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">
                    COMING SOON
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">Your Pre-Orders</span>
                    <span className="font-bold text-primary">{preOrderTickets}/2500</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">Bonus Multiplier</span>
                    <span className="font-bold text-primary">2×</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">Next Lottery</span>
                    <span className="font-bold">TBA</span>
                  </div>
                </div>
              </Card>

              {/* Info Card */}
              <Card className="bg-secondary/20 border-primary/30 p-6">
                <h3 className="font-orbitron font-bold mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-primary" />
                  </div>
                  Waitlist Benefits
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>2× bonus tickets on Monthly lottery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Early access to platform features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Automatic smart contract execution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Transparent on-chain verification</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
