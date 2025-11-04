import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Zap, Calendar, Sparkles, Clock, Gift } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';

const Lotteries = () => {
  const launchDate = new Date('2025-11-12T18:00:00+01:00');
  const isPreOrder = new Date() < launchDate;

  const lotteries = [
    {
      title: 'Monthly Lottery',
      icon: Trophy,
      color: 'primary',
      path: '/monthly',
      description: 'The ultimate prize pool with multiple winning tiers',
      features: [
        '60% Jackpot Winner',
        '5% Runner-Up',
        '5% to 100 Winners',
        'Monthly Draws'
      ],
      badge: isPreOrder ? 'PRE-ORDER 2× BONUS' : 'LIVE',
      accentColor: 'from-primary via-accent to-primary',
      borderColor: 'border-primary/30',
      shadowColor: 'shadow-primary/20'
    },
    {
      title: 'Weekly Lottery',
      icon: Zap,
      color: 'accent',
      path: '/weekly',
      description: 'Fast-paced action with great prizes every week',
      features: [
        '65% Main Winner',
        '5% Runner-Up',
        'Weekly Draws',
        'Quick & Exciting'
      ],
      badge: 'PRE-ORDER',
      accentColor: 'from-accent via-primary to-accent',
      borderColor: 'border-accent/30',
      shadowColor: 'shadow-accent/20'
    },
    {
      title: 'Daily Lottery',
      icon: Calendar,
      color: 'primary',
      path: '/daily',
      description: 'New winner every day! Quick, exciting, and rewarding',
      features: [
        '70% Winner',
        'Daily Draws',
        'Fast Payouts',
        'Daily Action'
      ],
      badge: 'PRE-ORDER',
      accentColor: 'from-primary via-accent to-primary',
      borderColor: 'border-primary/30',
      shadowColor: 'shadow-primary/20'
    }
  ];

  const comingSoon = [
    {
      title: 'Hourly Lottery',
      icon: Clock,
      description: 'Win every hour with instant excitement',
    },
    {
      title: 'Mega Lottery',
      icon: Gift,
      description: 'Massive jackpots for the biggest winners',
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-12 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
              <Sparkles className="w-5 h-5 text-primary inline mr-2" />
              <span className="text-primary text-sm font-medium">All Lotteries</span>
            </div>
            
            <h1 className="font-orbitron text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Choose Your Lottery
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Three ways to win big on Solana. Pick your lottery and start playing today.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Active Lotteries Grid */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {lotteries.map((lottery, index) => (
              <motion.div
                key={lottery.path}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={lottery.path}>
                  <div className={`bg-card border ${lottery.borderColor} rounded-2xl p-6 hover:shadow-lg hover:${lottery.shadowColor} transition-all group h-full flex flex-col`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 bg-${lottery.color}/10 rounded-xl flex items-center justify-center`}>
                        <lottery.icon className={`w-7 h-7 text-${lottery.color}`} />
                      </div>
                      <span className={`px-3 py-1 bg-${lottery.color}/20 border border-${lottery.color} rounded-full text-xs font-bold text-${lottery.color}`}>
                        {lottery.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className={`font-orbitron text-2xl font-bold mb-2 bg-gradient-to-r ${lottery.accentColor} bg-clip-text text-transparent`}>
                      {lottery.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {lottery.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mt-auto">
                      {lottery.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full bg-${lottery.color}`}></div>
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button 
                      className={`mt-6 w-full bg-${lottery.color} hover:bg-${lottery.color}/90`}
                    >
                      {isPreOrder && lottery.badge.includes('2×') ? 'Pre-Order Now' : isPreOrder ? 'Pre-Order' : 'Play Now'}
                    </Button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold mb-2">
              Coming Soon
            </h2>
            <p className="text-muted-foreground">
              More ways to win are on the horizon
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {comingSoon.map((lottery, index) => (
              <motion.div
                key={lottery.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border/50 rounded-2xl p-8 text-center opacity-60 hover:opacity-80 transition-all"
              >
                <div className="w-16 h-16 bg-muted/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <lottery.icon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-orbitron text-xl font-bold mb-2 text-foreground">
                  {lottery.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {lottery.description}
                </p>
                <div className="inline-block px-4 py-2 rounded-full bg-muted/10 border border-muted/20">
                  <span className="text-xs font-semibold text-muted-foreground">Coming Soon</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Lotteries;