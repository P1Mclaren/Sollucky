import { motion } from 'framer-motion';
import { ArrowRight, Zap, Lock, Sparkles, Gift, Ticket, TrendingUp, Trophy, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FAQ } from '@/components/FAQ';
import { LotteryCountdown } from '@/components/LotteryCountdown';

export default function Landing() {
  const launchDate = new Date('2025-01-13T18:00:00+01:00');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium">
              Powered by Solana Blockchain
            </div>
            
            <h1 className="font-orbitron text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              SOLLUCKY
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The first fully automated, decentralized lottery platform on Solana. Win big with Daily, Weekly & Monthly draws.
            </p>

            {/* Countdown Timer */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8"
            >
              <LotteryCountdown targetDate={launchDate} />
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link to="/monthly">
                <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold px-8">
                  <Gift className="w-5 h-5 mr-2" />
                  Pre-Order Monthly (2× Bonus)
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lotteries Grid */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold mb-2">
              Three Ways to Win
            </h2>
            <p className="text-muted-foreground">
              Choose your lottery and start winning
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Monthly Lottery Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Link to="/monthly">
                <div className="bg-card border border-primary/30 rounded-xl p-6 hover:shadow-lg hover:shadow-primary/20 transition-all group h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <span className="px-3 py-1 bg-primary/20 border border-primary rounded-full text-xs font-bold text-primary">
                      PRE-ORDER 2× BONUS
                    </span>
                  </div>
                  <h3 className="font-orbitron text-2xl font-bold mb-2">Monthly Lottery</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Biggest prizes, best rewards. 70% prize pool split between jackpot, runner-up, and 100 winners.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prize Pool:</span>
                      <span className="font-bold text-primary">70%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jackpot:</span>
                      <span className="font-bold">60%</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Weekly Lottery Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Link to="/weekly">
                <div className="bg-card border border-accent/30 rounded-xl p-6 hover:shadow-lg hover:shadow-accent/20 transition-all group h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-accent" />
                    </div>
                    <span className="px-3 py-1 bg-accent/20 border border-accent rounded-full text-xs font-bold text-accent">
                      WEEKLY
                    </span>
                  </div>
                  <h3 className="font-orbitron text-2xl font-bold mb-2">Weekly Lottery</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fast-paced action with great prizes every week. Main winner takes 65%, runner-up gets 5%.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prize Pool:</span>
                      <span className="font-bold text-accent">70%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Main Winner:</span>
                      <span className="font-bold">65%</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Daily Lottery Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Link to="/daily">
                <div className="bg-card border border-primary/30 rounded-xl p-6 hover:shadow-lg hover:shadow-primary/20 transition-all group h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <span className="px-3 py-1 bg-primary/20 border border-primary rounded-full text-xs font-bold text-primary">
                      DAILY
                    </span>
                  </div>
                  <h3 className="font-orbitron text-2xl font-bold mb-2">Daily Lottery</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    New winner every day! Quick, exciting, and rewarding. Winner takes all 70%.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prize Pool:</span>
                      <span className="font-bold text-primary">70%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Winner:</span>
                      <span className="font-bold">70%</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold mb-2">
              Fully Automated
            </h2>
            <p className="text-muted-foreground">
              No humans, no manipulation. Pure blockchain automation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Ticket,
                title: 'Buy Tickets',
                description: '$1 USD per ticket, converted to SOL',
                color: 'primary'
              },
              {
                icon: Lock,
                title: 'Pool Funds',
                description: '70% prize pool, automated split',
                color: 'accent'
              },
              {
                icon: Sparkles,
                title: 'Auto Draw',
                description: 'Smart contracts execute draws',
                color: 'primary'
              },
              {
                icon: Gift,
                title: 'Instant Payout',
                description: 'SOL sent directly to winners',
                color: 'accent'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 bg-card border border-border rounded-xl"
              >
                <div className={`w-14 h-14 rounded-xl bg-${step.color}/10 flex items-center justify-center mx-auto mb-3`}>
                  <step.icon className={`w-7 h-7 text-${step.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card border border-primary/30 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="font-orbitron text-4xl font-bold text-primary mb-2">$1</div>
                <p className="text-sm text-muted-foreground">Per Ticket</p>
              </div>
              <div>
                <div className="font-orbitron text-4xl font-bold text-accent mb-2">70%</div>
                <p className="text-sm text-muted-foreground">To Prize Pool</p>
              </div>
              <div>
                <div className="font-orbitron text-4xl font-bold text-primary mb-2">100%</div>
                <p className="text-sm text-muted-foreground">Automated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      <Footer />
    </div>
  );
}