import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LotteryCountdown } from '@/components/LotteryCountdown';
import { TicketPurchase } from '@/components/TicketPurchase';
import { Trophy, Sparkles, Rocket } from 'lucide-react';

const DailyLottery = () => {
  const launchDate = new Date('2025-01-13T18:00:00+01:00');
  const isPreOrder = new Date() < launchDate;
  const solPrice = 200;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        <div className="text-center space-y-4 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <Rocket className="w-5 h-5 text-primary" />
            <span className="font-orbitron text-primary font-semibold">Daily Lottery</span>
          </div>
          <h1 className="font-orbitron text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Daily Draws
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            New winner every day! Quick, exciting, and rewarding!
          </p>
        </div>

        {isPreOrder && (
          <div className="max-w-2xl mx-auto">
            <LotteryCountdown targetDate={launchDate} />
          </div>
        )}

        <div className="max-w-md mx-auto">
          <div className="bg-card border border-primary/30 rounded-2xl p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="font-orbitron text-4xl font-bold text-primary">70%</h3>
              <p className="text-muted-foreground text-lg">Winner Takes All</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <TicketPurchase 
            lotteryType="daily" 
            isPreOrder={isPreOrder}
            solPrice={solPrice}
            showReferralInput={false}
          />
        </div>

        <div className="max-w-4xl mx-auto bg-card border border-primary/30 rounded-2xl p-8 space-y-6">
          <h2 className="font-orbitron text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            How It Works
          </h2>
          
          <div className="space-y-4 text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">1</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Purchase Tickets</h3>
                <p>Each ticket costs $1 USD (converted to SOL). Buy as many as you like!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">2</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Daily Winner</h3>
                <p>One lucky winner is chosen every single day. More tickets = better chances!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">3</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">70% Prize Pool</h3>
                <p>The winner receives 70% of all ticket sales for that day</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">4</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Fast & Fair</h3>
                <p>Automated on-chain selection ensures fairness. Prizes sent instantly!</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DailyLottery;