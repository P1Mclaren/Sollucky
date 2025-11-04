import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Zap, Calendar, Sparkles, Clock, Gift, DollarSign, Users, TrendingUp, Star } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Button } from '@/components/ui/button';
import { LotteryCountdown } from '@/components/LotteryCountdown';

const Lotteries = () => {
  const launchDate = new Date('2025-11-12T18:00:00+01:00');
  const isPreOrder = new Date() < launchDate;

  const lotteries = [
    {
      title: 'Monthly Lottery',
      icon: Trophy,
      color: 'primary',
      path: '/monthly',
      description: 'Life-changing jackpots with the biggest prize pools',
      estimatedPrize: '~70 SOL',
      usdValue: '$7,000 - $8,400',
      features: [
        { icon: Trophy, text: '60% Jackpot Winner' },
        { icon: Star, text: '5% Runner-Up Prize' },
        { icon: Gift, text: '5% Split to 100 Winners' },
        { icon: TrendingUp, text: 'Biggest Prize Pool' }
      ],
      badge: isPreOrder ? 'PRE-ORDER 2× BONUS' : 'LIVE',
      highlight: true,
      accentColor: 'from-primary via-accent to-primary',
      borderColor: 'border-primary/30',
      shadowColor: 'shadow-primary/20'
    },
    {
      title: 'Weekly Lottery',
      icon: Zap,
      color: 'accent',
      path: '/weekly',
      description: 'Perfect balance of frequency and prize size',
      estimatedPrize: '~15 SOL',
      usdValue: '$1,500 - $1,800',
      features: [
        { icon: Zap, text: '65% Main Winner Takes' },
        { icon: Star, text: '5% Runner-Up Prize' },
        { icon: Calendar, text: 'Weekly Draws' },
        { icon: TrendingUp, text: 'Fast-Paced Action' }
      ],
      badge: 'PRE-ORDER',
      highlight: false,
      accentColor: 'from-accent via-primary to-accent',
      borderColor: 'border-accent/30',
      shadowColor: 'shadow-accent/20'
    },
    {
      title: 'Daily Lottery',
      icon: Calendar,
      color: 'primary',
      path: '/daily',
      description: 'Win every single day with guaranteed payouts',
      estimatedPrize: '~2 SOL',
      usdValue: '$200 - $240',
      features: [
        { icon: DollarSign, text: '70% Winner Takes All' },
        { icon: Calendar, text: 'Daily Draws' },
        { icon: Zap, text: 'Instant Payouts' },
        { icon: Users, text: 'Best Winning Odds' }
      ],
      badge: 'PRE-ORDER',
      highlight: false,
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
      <section className="relative pt-32 pb-8 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {isPreOrder && (
              <div className="inline-block mb-4 px-6 py-2 rounded-full bg-primary/20 border-2 border-primary animate-pulse">
                <Sparkles className="w-5 h-5 text-primary inline mr-2" />
                <span className="text-primary text-sm font-bold">LIMITED TIME PRE-ORDER</span>
              </div>
            )}
            
            <h1 className="font-orbitron text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Win Big on Solana
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              Three ways to win. One simple rule: <span className="text-primary font-bold">$1 = 1 ticket</span>
            </p>
            
            <p className="text-md text-muted-foreground mb-8">
              Fully automated. Provably fair. Instant payouts.
            </p>

            {isPreOrder && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-8"
              >
                <LotteryCountdown targetDate={launchDate} />
              </motion.div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-12"
          >
            <div className="text-center">
              <div className="font-orbitron text-3xl md:text-4xl font-bold text-primary mb-1">70%</div>
              <p className="text-xs md:text-sm text-muted-foreground">Prize Pool</p>
            </div>
            <div className="text-center">
              <div className="font-orbitron text-3xl md:text-4xl font-bold text-accent mb-1">$1</div>
              <p className="text-xs md:text-sm text-muted-foreground">Per Ticket</p>
            </div>
            <div className="text-center">
              <div className="font-orbitron text-3xl md:text-4xl font-bold text-primary mb-1">100%</div>
              <p className="text-xs md:text-sm text-muted-foreground">Automated</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Active Lotteries Grid */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {lotteries.map((lottery, index) => (
              <motion.div
                key={lottery.path}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={lottery.highlight ? 'lg:scale-105' : ''}
              >
                <Link to={lottery.path}>
                  <div className={`relative bg-card border-2 ${lottery.borderColor} rounded-2xl p-6 hover:shadow-2xl hover:${lottery.shadowColor} transition-all group h-full flex flex-col ${
                    lottery.highlight ? 'shadow-lg shadow-primary/30' : ''
                  }`}>
                    {/* Popular Badge */}
                    {lottery.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-xs font-bold text-primary-foreground">
                        🔥 MOST POPULAR
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-16 h-16 bg-${lottery.color}/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <lottery.icon className={`w-8 h-8 text-${lottery.color}`} />
                      </div>
                      <span className={`px-4 py-1.5 bg-${lottery.color}/20 border-2 border-${lottery.color} rounded-full text-xs font-bold text-${lottery.color} animate-pulse`}>
                        {lottery.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className={`font-orbitron text-3xl font-black mb-2 bg-gradient-to-r ${lottery.accentColor} bg-clip-text text-transparent`}>
                      {lottery.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {lottery.description}
                    </p>

                    {/* Prize Pool Display */}
                    <div className={`bg-gradient-to-r ${lottery.accentColor} bg-opacity-10 rounded-xl p-4 mb-6 border border-${lottery.color}/20`}>
                      <p className="text-xs text-muted-foreground mb-1">Estimated Prize Pool</p>
                      <div className={`font-orbitron text-2xl font-bold text-${lottery.color} mb-1`}>
                        {lottery.estimatedPrize}
                      </div>
                      <p className="text-xs text-muted-foreground">{lottery.usdValue}</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {lottery.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <div className={`w-8 h-8 rounded-lg bg-${lottery.color}/10 flex items-center justify-center flex-shrink-0`}>
                            <feature.icon className={`w-4 h-4 text-${lottery.color}`} />
                          </div>
                          <span className="text-foreground font-medium">{feature.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button 
                      className={`mt-auto w-full bg-${lottery.color} hover:bg-${lottery.color}/90 text-lg py-6 font-bold group-hover:scale-105 transition-transform`}
                    >
                      {isPreOrder && lottery.badge.includes('2×') ? '🎁 Get 2× Bonus Now' : isPreOrder ? '🎟️ Pre-Order Tickets' : '🚀 Play Now'}
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