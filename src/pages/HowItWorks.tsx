import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Ticket, Wallet, Zap, TrendingUp, Shield, Clock } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Wallet,
      title: "Connect Your Wallet",
      description: "Connect your Solana wallet (Phantom, Solflare, etc.) to get started. Your wallet is your secure gateway to the lottery.",
    },
    {
      icon: Ticket,
      title: "Purchase Tickets",
      description: "Choose from Daily, Weekly, or Monthly lotteries. Each ticket gives you a chance to win. The more tickets, the better your odds!",
    },
    {
      icon: Zap,
      title: "Automated Draw",
      description: "Our smart contracts automatically conduct fair and transparent draws at scheduled times. Everything happens on-chain.",
    },
    {
      icon: TrendingUp,
      title: "Instant Payouts",
      description: "Winners receive SOL directly to their wallets instantly. No waiting, no manual claims - completely automated.",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Provably Fair",
      description: "All draws are executed by smart contracts on Solana blockchain, ensuring complete transparency and fairness.",
    },
    {
      icon: Clock,
      title: "Automated",
      description: "Everything runs automatically - from ticket sales to draws to payouts. No human intervention needed.",
    },
    {
      icon: TrendingUp,
      title: "Growing Pools",
      description: "Prize pools accumulate as more players join. The more participation, the bigger the rewards!",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              How Sollucky Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A next-generation decentralized lottery platform built on Solana. 
              Transparent, automated, and fair.
            </p>
          </div>

          {/* Steps Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-orbitron font-bold text-center mb-12">
              Simple 4-Step Process
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-card/50 border border-border/50 rounded-lg p-6 hover:bg-card/70 transition-colors h-full">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-orbitron font-bold text-primary">{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-orbitron font-bold text-center mb-12">
              Why Choose Sollucky?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-card/50 border border-border/50 rounded-lg p-8 hover:bg-card/70 transition-colors"
                >
                  <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Lottery Types Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-orbitron font-bold text-center mb-12">
              Lottery Types
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card/50 border border-border/50 rounded-lg p-8">
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
                    <span className="font-orbitron font-bold text-primary">DAILY</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Daily Lottery</h3>
                  <p className="text-muted-foreground">Quick wins every day</p>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Draws happen every 24 hours
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Lower ticket prices, frequent chances
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Perfect for daily excitement
                  </li>
                </ul>
              </div>

              <div className="bg-card/50 border border-border/50 rounded-lg p-8">
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
                    <span className="font-orbitron font-bold text-primary">WEEKLY</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Weekly Lottery</h3>
                  <p className="text-muted-foreground">Balanced risk and reward</p>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Draws every 7 days
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Moderate ticket prices
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Great balance of frequency and pot size
                  </li>
                </ul>
              </div>

              <div className="bg-card/50 border border-border/50 rounded-lg p-8">
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
                    <span className="font-orbitron font-bold text-primary">MONTHLY</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Monthly Lottery</h3>
                  <p className="text-muted-foreground">Biggest jackpots</p>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Draws once per month
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Largest prize pools
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Pre-order available with bonus tickets
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-card/50 border border-border/50 rounded-lg p-8 md:p-12">
            <h2 className="text-3xl font-orbitron font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8 max-w-3xl mx-auto">
              <div>
                <h3 className="text-xl font-semibold mb-3">Is Sollucky safe?</h3>
                <p className="text-muted-foreground">
                  Yes! All operations run on audited smart contracts on the Solana blockchain. 
                  Everything is transparent and verifiable on-chain.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">How are winners selected?</h3>
                <p className="text-muted-foreground">
                  Winners are selected through a provably fair random number generation process 
                  executed by our smart contracts. The process is completely automated and transparent.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">When do I receive my winnings?</h3>
                <p className="text-muted-foreground">
                  Winnings are sent instantly to your wallet as soon as the draw is complete. 
                  No manual claims needed!
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">What are the odds of winning?</h3>
                <p className="text-muted-foreground">
                  Odds are clearly displayed for each lottery and depend on the total number of tickets sold. 
                  More tickets = better odds for you!
                </p>
              </div>
            </div>
          </section>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
