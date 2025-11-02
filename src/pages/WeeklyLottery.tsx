import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LotteryCountdown } from '@/components/LotteryCountdown';
import { TicketPurchase } from '@/components/TicketPurchase';
import { Trophy, Gift, Sparkles, Zap } from 'lucide-react';
import { useSolPrice } from '@/hooks/useSolPrice';

const WeeklyLottery = () => {
  const launchDate = new Date('2025-11-15T18:00:00+01:00');
  const isPreOrder = new Date() < launchDate;
  const { solPrice } = useSolPrice();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-6 space-y-6">
        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 border-2 border-accent rounded-full">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-orbitron text-accent font-semibold">Weekly Lottery</span>
          </div>
          <h1 className="font-orbitron text-4xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
            Weekly Winners
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fast-paced action with great prizes every week!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Countdown */}
            {isPreOrder && <LotteryCountdown targetDate={launchDate} />}

            {/* Prize Distribution */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-accent/30 rounded-xl p-4 text-center space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-orbitron text-xl font-bold text-accent">65%</h3>
                  <p className="text-xs text-muted-foreground">Main Winner</p>
                </div>
              </div>

              <div className="bg-card border border-primary/30 rounded-xl p-4 text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-orbitron text-xl font-bold text-primary">5%</h3>
                  <p className="text-xs text-muted-foreground">Runner-Up</p>
                </div>
              </div>
            </div>

            {/* Rules Section */}
            <div className="bg-card border border-accent/30 rounded-xl p-5 space-y-4">
              <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                How It Works
              </h2>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold text-xs">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Purchase Tickets</h3>
                    <p className="text-xs">$1 USD each (converted to SOL)</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold text-xs">2</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Weekly Draws</h3>
                    <p className="text-xs">Winners selected every week</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold text-xs">3</div>
                  <div>
                    <h3 className="font-semibold text-foreground">70% Prize Pool</h3>
                    <p className="text-xs">65% main winner, 5% runner-up</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold text-xs">4</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Instant Payouts</h3>
                    <p className="text-xs">Auto-sent to winning wallets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Purchase */}
          <div>
            <TicketPurchase 
              lotteryType="weekly" 
              isPreOrder={isPreOrder}
              solPrice={solPrice}
              showReferralInput={false}
            />
          </div>
        </div>

        {/* Spacer for mobile */}
        <div className="lg:hidden h-4"></div>
      </main>

      <Footer />
    </div>
  );
};

export default WeeklyLottery;