import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LotteryCountdown } from '@/components/LotteryCountdown';
import { TicketPurchase } from '@/components/TicketPurchase';
import { Trophy, Gift, Users, Sparkles } from 'lucide-react';
import { useSolPrice } from '@/hooks/useSolPrice';

const MonthlyLottery = () => {
  // Launch date: 13th January 2025 at 6 PM CET (18:00 CET)
  const launchDate = new Date('2025-01-13T18:00:00+01:00');
  const isPreOrder = new Date() < launchDate;
  
  const { solPrice } = useSolPrice();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border-2 border-primary rounded-full">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-orbitron text-primary font-semibold">Monthly Lottery</span>
          </div>
          <h1 className="font-orbitron text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Monthly Jackpot
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The biggest prizes, the best odds. Win up to 60% of the total prize pool!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Countdown */}
            {isPreOrder && <LotteryCountdown targetDate={launchDate} />}

            {/* Prize Distribution */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-primary/30 rounded-xl p-4 text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-orbitron text-xl font-bold text-primary">60%</h3>
                  <p className="text-xs text-muted-foreground">Jackpot</p>
                </div>
              </div>

              <div className="bg-card border border-primary/30 rounded-xl p-4 text-center space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-orbitron text-xl font-bold text-accent">5%</h3>
                  <p className="text-xs text-muted-foreground">2nd Place</p>
                </div>
              </div>

              <div className="bg-card border border-primary/30 rounded-xl p-4 text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-orbitron text-xl font-bold text-primary">5%</h3>
                  <p className="text-xs text-muted-foreground">100 Winners</p>
                </div>
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

                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">2</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Pre-Order Bonus</h3>
                    <p className="text-xs">Buy early, get 2× tickets!</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">3</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Use Referral Codes</h3>
                    <p className="text-xs">Support creators with affiliate codes</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">4</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Auto Winner Selection</h3>
                    <p className="text-xs">Fair on-chain random selection</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">5</div>
                  <div>
                    <h3 className="font-semibold text-foreground">70% Prize Pool</h3>
                    <p className="text-xs">Distributed among winners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Purchase */}
          <div>
            <TicketPurchase 
              lotteryType="monthly" 
              isPreOrder={isPreOrder}
              solPrice={solPrice}
              showReferralInput={true}
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

export default MonthlyLottery;