import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LotteryCountdown } from '@/components/LotteryCountdown';
import { TicketPurchase } from '@/components/TicketPurchase';
import { Trophy, Gift, Sparkles, Zap } from 'lucide-react';

const WeeklyLottery = () => {
  const launchDate = new Date('2025-01-13T18:00:00+01:00');
  const isPreOrder = new Date() < launchDate;
  const solPrice = 200;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        <div className="text-center space-y-4 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-orbitron text-accent font-semibold">Weekly Lottery</span>
          </div>
          <h1 className="font-orbitron text-5xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
            Weekly Winners
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fast-paced action with great prizes every week!
          </p>
        </div>

        {isPreOrder && (
          <div className="max-w-2xl mx-auto">
            <LotteryCountdown targetDate={launchDate} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-card border border-accent/30 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="font-orbitron text-2xl font-bold text-accent">65%</h3>
              <p className="text-muted-foreground">Main Winner</p>
            </div>
          </div>

          <div className="bg-card border border-primary/30 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-orbitron text-2xl font-bold text-primary">5%</h3>
              <p className="text-muted-foreground">Runner-Up</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <TicketPurchase 
            lotteryType="weekly" 
            isPreOrder={isPreOrder}
            solPrice={solPrice}
            showReferralInput={false}
          />
        </div>

        <div className="max-w-4xl mx-auto bg-card border border-accent/30 rounded-2xl p-8 space-y-6">
          <h2 className="font-orbitron text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            How It Works
          </h2>
          
          <div className="space-y-4 text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold">1</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Purchase Tickets</h3>
                <p>Each ticket costs $1 USD (converted to SOL at current market price)</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold">2</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Weekly Draws</h3>
                <p>Winners are selected every week. Fast turnaround means more chances to win!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold">3</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">70% Prize Pool</h3>
                <p>70% of ticket sales go to prizes: 65% to the main winner, 5% to the runner-up</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold">4</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Instant Payouts</h3>
                <p>Prizes are automatically sent to winning wallets immediately after the draw</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WeeklyLottery;