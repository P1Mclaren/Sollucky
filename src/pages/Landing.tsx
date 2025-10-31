import { motion } from 'framer-motion';
import { ArrowRight, Zap, Lock, Sparkles, Gift, Ticket, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LotteryCard } from '@/components/LotteryCard';
import { FAQ } from '@/components/FAQ';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium">
              Powered by Solana Blockchain
            </div>
            
            <h1 className="font-orbitron text-5xl md:text-7xl lg:text-8xl font-black mb-6 text-glow-purple">
              BECOME SO LUCKY
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The first fully automated, decentralized lottery platform on Solana. Join the waitlist and pre-order tickets.
            </p>

            {/* Platform Status */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-block mb-12"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse-glow" />
                <div className="relative bg-card/80 backdrop-blur-sm border border-primary/50 rounded-3xl p-8 md:p-10">
                  <div className="text-xs font-medium text-primary mb-3 tracking-wider uppercase">Platform Status</div>
                  <div className="font-orbitron text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary mb-3">
                    COMING SOON
                  </div>
                  <div className="text-sm text-muted-foreground">Connect wallet to pre-order Monthly tickets</div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 text-lg shadow-neon"
                onClick={() => document.getElementById('pre-order')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Pre-Order Tickets
              </Button>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 px-8 py-6 text-lg">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lotteries Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold mb-4 text-glow-purple">
              Three Ways to Win
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose your lottery, buy tickets, and let the blockchain do the rest
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <LotteryCard
              title="Monthly Lottery"
              description="Unlimited tickets - Pre-order now with 2× bonus"
              status="pre-order"
              nextDraw="Coming Soon"
              index={0}
            />
            <LotteryCard
              title="Weekly Lottery"
              description="Limited entries, better odds"
              ticketLimit={5000}
              status="coming-soon"
              nextDraw="Coming Soon"
              index={1}
            />
            <LotteryCard
              title="Daily Lottery"
              description="Quick draws, instant excitement"
              ticketLimit={1000}
              status="coming-soon"
              nextDraw="Coming Soon"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Pre-Order Section */}
      <section id="pre-order" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-card border border-primary/30 rounded-3xl p-8 md:p-12 shadow-neon">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-orbitron text-3xl md:text-4xl font-bold mb-4">
                    Pre-Order Monthly Lottery Tickets
                  </h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    Connect your wallet and pre-order tickets for the upcoming Monthly lottery. Get <span className="text-primary font-bold">2× bonus tickets</span> when you pre-order now (max 250 total).
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-xl bg-background border border-border">
                  <Ticket className="w-8 h-8 mb-2 text-primary" />
                  <h3 className="font-bold mb-2">Double Tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    Pre-order tickets for the Monthly lottery and receive 2× the amount
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-background border border-border">
                  <Zap className="w-8 h-8 mb-2 text-accent" />
                  <h3 className="font-bold mb-2">Instant Deposits</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet and deposit SOL in seconds via Phantom or Solflare
                  </p>
                </div>
              </div>

              <Link to="/dashboard">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-neon">
                  Pre-Order Now
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold mb-4 text-glow-purple">
              Fully Automated
            </h2>
            <p className="text-muted-foreground text-lg">
              No humans, no manipulation. Pure blockchain automation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: 'Buy Tickets',
                description: 'Connect wallet and purchase tickets pegged at $1 USD worth of SOL',
                color: 'from-primary to-primary/50',
              },
              {
                icon: Lock,
                title: 'Pool Funds',
                description: '70% to prize pool, 5% operational costs, 25% platform — all automatic',
                color: 'from-accent to-accent/50',
              },
              {
                icon: Sparkles,
                title: 'Auto Draw',
                description: 'Smart contracts execute draws on schedule using verifiable randomness',
                color: 'from-primary to-accent',
              },
              {
                icon: Gift,
                title: 'Instant Payout',
                description: 'Winners receive SOL directly to their wallet — no delays',
                color: 'from-accent to-primary',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4 shadow-neon`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-block mb-6 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-medium">
              Coming Soon
            </div>
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold mb-6">
              Level Up Your Luck
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Unlock exclusive sub-lotteries, cashback rewards, and private events. Leveling system and loyalty perks launching soon.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-xl bg-card border border-border">
                <Lock className="w-10 h-10 mb-2 text-primary" />
                <h3 className="font-bold mb-1">Private Lotteries</h3>
                <p className="text-sm text-muted-foreground">Exclusive draws for VIP members</p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border">
                <TrendingUp className="w-10 h-10 mb-2 text-accent" />
                <h3 className="font-bold mb-1">Cashback Rewards</h3>
                <p className="text-sm text-muted-foreground">Earn back a % of your tickets</p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border">
                <Sparkles className="w-10 h-10 mb-2 text-primary" />
                <h3 className="font-bold mb-1">Special Events</h3>
                <p className="text-sm text-muted-foreground">Jackpot multipliers & bonuses</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      <Footer />
    </div>
  );
}
