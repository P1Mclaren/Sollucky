import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Zap, Calendar, Sparkles } from 'lucide-react';
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


  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-8 md:pb-12 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary inline mr-2" />
              <span className="text-primary text-sm font-medium">All Lotteries</span>
            </div>
            
            <h1 className="font-orbitron text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent px-2">
              Choose Your Lottery
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-4">
              Three ways to win big on Solana. Pick your lottery and start playing today.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Active Lotteries Grid */}
      <section className="py-8 md:py-12 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {lotteries.map((lottery, index) => (
              <motion.div
                key={lottery.path}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={lottery.path}>
                  <div className={`bg-card border ${lottery.borderColor} rounded-xl md:rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:${lottery.shadowColor} transition-all group h-full flex flex-col active:scale-95`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-${lottery.color}/10 rounded-xl flex items-center justify-center`}>
                        <lottery.icon className={`w-6 h-6 sm:w-7 sm:h-7 text-${lottery.color}`} />
                      </div>
                      <span className={`px-2.5 sm:px-3 py-1 bg-${lottery.color}/20 border border-${lottery.color} rounded-full text-xs font-bold text-${lottery.color}`}>
                        {lottery.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className={`font-orbitron text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r ${lottery.accentColor} bg-clip-text text-transparent`}>
                      {lottery.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
                      {lottery.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mt-auto mb-4">
                      {lottery.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full bg-${lottery.color}`}></div>
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button 
                      className={`mt-2 w-full bg-${lottery.color} hover:bg-${lottery.color}/90 h-12 text-base font-semibold`}
                    >
                      Pre-Order Now
                    </Button>
                  </div>
                </Link>
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