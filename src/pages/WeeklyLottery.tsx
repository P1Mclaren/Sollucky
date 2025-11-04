import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LotteryCountdown } from '@/components/LotteryCountdown';
import { TicketPurchase } from '@/components/TicketPurchase';
import { JackpotDisplay } from '@/components/JackpotDisplay';
import { Trophy, Gift, Sparkles, Zap } from 'lucide-react';
import { useSolPrice } from '@/hooks/useSolPrice';

const WeeklyLottery = () => {
  const launchDate = new Date('2025-11-12T18:00:00+01:00');
  const isPreOrder = new Date() < launchDate;
  const { solPrice } = useSolPrice();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-6 space-y-6">
        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-purple/20 border-2 border-neon-purple rounded-full">
            <Zap className="w-5 h-5 text-neon-purple" />
            <span className="font-orbitron text-neon-purple font-semibold">Weekly Lottery</span>
          </div>
          <h1 className="font-orbitron text-4xl font-bold bg-gradient-to-r from-neon-purple via-primary to-neon-purple bg-clip-text text-transparent">
            Weekly Winners
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fast-paced action with great prizes every week!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Jackpot Display */}
            <JackpotDisplay lotteryType="weekly" accentColor="neon-purple" isPreOrder={isPreOrder} />

            {/* Countdown */}
            {isPreOrder && <LotteryCountdown targetDate={launchDate} />}

            {/* Prize Distribution */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-neon-purple/30 rounded-xl p-4 text-center space-y-2">
                <div className="w-12 h-12 bg-neon-purple/10 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <h3 className="font-orbitron text-xl font-bold text-neon-purple">65%</h3>
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
            <div className="bg-card border border-neon-purple/30 rounded-xl p-5 space-y-4">
              <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neon-purple" />
                How It Works
              </h2>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-neon-purple/10 flex items-center justify-center flex-shrink-0 text-neon-purple font-bold text-xs">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Purchase Tickets</h3>
                    <p className="text-xs">$1 USD each (converted to SOL)</p>
                  </div>
                </div>

                {isPreOrder && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-neon-purple/10 flex items-center justify-center flex-shrink-0 text-neon-purple font-bold text-xs">2</div>
                    <div>
                      <h3 className="font-semibold text-foreground">Pre-Order Phase</h3>
                      <p className="text-xs">Buy tickets before official launch</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className={`w-6 h-6 rounded-full bg-neon-purple/10 flex items-center justify-center flex-shrink-0 text-neon-purple font-bold text-xs`}>{isPreOrder ? '3' : '2'}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Weekly Draws</h3>
                    <p className="text-xs">Winners selected every week</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className={`w-6 h-6 rounded-full bg-neon-purple/10 flex items-center justify-center flex-shrink-0 text-neon-purple font-bold text-xs`}>{isPreOrder ? '4' : '3'}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">70% Prize Pool</h3>
                    <p className="text-xs">65% main winner, 5% runner-up</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className={`w-6 h-6 rounded-full bg-neon-purple/10 flex items-center justify-center flex-shrink-0 text-neon-purple font-bold text-xs`}>{isPreOrder ? '5' : '4'}</div>
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