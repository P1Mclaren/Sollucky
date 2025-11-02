import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { motion } from "framer-motion";
import { Ticket, Zap, Shield, Code, Lock, CheckCircle, Users, TrendingUp, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              How It Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Fully automated, provably fair lottery system powered by Solana blockchain
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Ticket, title: "Buy Tickets", desc: "$1 USD per ticket" },
              { icon: Lock, title: "Unique Codes", desc: "Each ticket gets a random code" },
              { icon: Zap, title: "Auto Draw", desc: "Random winner selection" },
              { icon: CheckCircle, title: "Instant Payout", desc: "SOL sent to winners" }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-primary/30 rounded-xl p-5 text-center"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Provably Fair System */}
          <div className="bg-card border border-primary/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="font-orbitron text-2xl font-bold">Provably Fair System</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Our lottery uses cryptographically secure randomness to ensure complete fairness. Every draw is transparent, verifiable, and impossible to manipulate.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* How Tickets Work */}
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4 text-accent" />
                    Ticket Generation
                  </h3>
                  <ol className="text-sm text-muted-foreground space-y-2">
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">1.</span>
                      When you purchase a ticket, a unique random code is generated using crypto.randomUUID()
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">2.</span>
                      This code is stored in the database linked to your wallet address
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">3.</span>
                      Bonus tickets receive separate unique codes
                    </li>
                  </ol>
                </div>

                {/* Winner Selection */}
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    Winner Selection
                  </h3>
                  <ol className="text-sm text-muted-foreground space-y-2">
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">1.</span>
                      All ticket codes for a draw are collected from the database
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">2.</span>
                      A cryptographically secure random index is selected
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">3.</span>
                      The winning code(s) are matched to wallet addresses
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Algorithm Code */}
          <div className="bg-card border border-accent/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-6 h-6 text-accent" />
              <h2 className="font-orbitron text-2xl font-bold">Random Selection Algorithm</h2>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Here's the actual algorithm used to select winners. This runs server-side in our Edge Functions:
            </p>

            <ScrollArea className="h-[400px] rounded-lg bg-background/80 border border-border">
              <pre className="p-4 text-xs font-mono">
                <code>{`// Winner Selection Algorithm
// Uses Web Crypto API for cryptographically secure randomness

async function selectWinners(drawId: string, prizeDistribution: any) {
  // 1. Fetch all ticket codes for this draw
  const { data: tickets } = await supabase
    .from('lottery_tickets')
    .select('id, ticket_code, wallet_address')
    .eq('draw_id', drawId);

  if (!tickets || tickets.length === 0) {
    throw new Error('No tickets found for draw');
  }

  const winners: Array<{
    ticketId: string;
    walletAddress: string;
    tier: string;
    prizeLamports: number;
  }> = [];

  // 2. Select winners based on prize distribution
  for (const [tier, config] of Object.entries(prizeDistribution)) {
    const numWinners = config.count;
    const prizePerWinner = config.prizeLamports;

    for (let i = 0; i < numWinners; i++) {
      // Generate cryptographically secure random index
      const randomIndex = getSecureRandomIndex(tickets.length);
      
      const winner = tickets[randomIndex];
      
      winners.push({
        ticketId: winner.id,
        walletAddress: winner.wallet_address,
        tier: tier,
        prizeLamports: prizePerWinner
      });

      // Remove from pool to avoid duplicate winners
      tickets.splice(randomIndex, 1);
      
      if (tickets.length === 0) break;
    }
  }

  return winners;
}

// Cryptographically secure random number generator
function getSecureRandomIndex(max: number): number {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  
  // Convert to number in range [0, max)
  return randomBuffer[0] % max;
}

// Ticket code generation (when purchasing)
function generateTicketCode(): string {
  return crypto.randomUUID();
}`}</code>
              </pre>
            </ScrollArea>
          </div>

          {/* Prize Distribution */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card border border-primary/30 rounded-xl p-5">
              <h3 className="font-orbitron text-lg font-bold mb-3 text-primary">Monthly Lottery</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prize Pool:</span>
                  <span className="font-bold">70%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jackpot (1 winner):</span>
                  <span className="font-bold text-primary">60%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">2nd Place:</span>
                  <span className="font-bold">5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">100 Winners:</span>
                  <span className="font-bold">5% split</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-accent/30 rounded-xl p-5">
              <h3 className="font-orbitron text-lg font-bold mb-3 text-accent">Weekly Lottery</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prize Pool:</span>
                  <span className="font-bold">70%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Main Winner:</span>
                  <span className="font-bold text-accent">65%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Runner-up:</span>
                  <span className="font-bold">5%</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-primary/30 rounded-xl p-5">
              <h3 className="font-orbitron text-lg font-bold mb-3 text-primary">Daily Lottery</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prize Pool:</span>
                  <span className="font-bold">70%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Winner:</span>
                  <span className="font-bold text-primary">70%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transparency Features */}
          <div className="bg-card border border-primary/30 rounded-xl p-6">
            <h2 className="font-orbitron text-2xl font-bold mb-4">Complete Transparency</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Users, title: "Public Winners", desc: "All winners are listed on the Wall of Fame with wallet addresses" },
                { icon: DollarSign, title: "Verified Payouts", desc: "Every payout transaction is recorded on Solana blockchain" },
                { icon: TrendingUp, title: "Real-time Stats", desc: "View total tickets sold, prize pools, and odds in real-time" }
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-5 text-center">
            <Shield className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Security Guarantee:</span> All randomness is generated using{" "}
              <code className="bg-background/50 px-2 py-1 rounded text-accent font-mono text-xs">crypto.getRandomValues()</code>,
              which is cryptographically secure and cannot be predicted or manipulated.
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
