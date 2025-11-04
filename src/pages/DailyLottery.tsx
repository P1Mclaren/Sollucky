import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LotteryCountdown } from '@/components/LotteryCountdown';
import { TicketPurchase } from '@/components/TicketPurchase';
import { JackpotDisplay } from '@/components/JackpotDisplay';
import { Trophy, Sparkles, Rocket } from 'lucide-react';
import { useSolPrice } from '@/hooks/useSolPrice';

const DailyLottery = () => {
  const launchDate = new Date('2025-11-12T18:00:00+01:00');
  const isPreOrder = new Date() < launchDate;
  const { solPrice } = useSolPrice();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-6 space-y-6">
        <div className="text-center space-y-3 py-4">
          {isPreOrder && (
            <div className="inline-block mb-2 px-6 py-2 bg-primary/30 border-2 border-primary rounded-full animate-pulse">
              <span className="font-orbitron text-primary font-bold text-sm">PRE-ORDER NOW</span>
            </div>
          )}
          <h1 className="font-orbitron text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Daily Lottery
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            New winner every day! Quick, exciting, and rewarding!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Jackpot Display */}
            <JackpotDisplay lotteryType="daily" accentColor="primary" isPreOrder={isPreOrder} />

            {/* Countdown */}
            {isPreOrder && <LotteryCountdown targetDate={launchDate} />}

            {/* Prize Display */}
            <div className="bg-card border border-primary/30 rounded-xl p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-orbitron text-3xl font-bold text-primary">70%</h3>
                <p className="text-muted-foreground">Winner Takes All</p>
              </div>
            </div>

            {/* Rules Section */}
            <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-4">
              <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                How It Works
              </h2>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Purchase Tickets</h3>
                    <p className="text-xs">$1 USD each (converted to SOL)</p>
                  </div>
                </div>

                {isPreOrder && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">2</div>
                    <div>
                      <h3 className="font-semibold text-foreground">Pre-Order Phase</h3>
                      <p className="text-xs">Buy tickets before official launch</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className={`w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs`}>{isPreOrder ? '3' : '2'}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Daily Winner</h3>
                    <p className="text-xs">One winner chosen every day</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className={`w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs`}>{isPreOrder ? '4' : '3'}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">70% Prize Pool</h3>
                    <p className="text-xs">Winner gets 70% of daily sales</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className={`w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs`}>{isPreOrder ? '5' : '4'}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Fast & Fair</h3>
                    <p className="text-xs">Auto on-chain selection, instant payout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Purchase */}
          <div>
            <TicketPurchase 
              lotteryType="daily" 
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

export default DailyLottery;