import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LotteryCountdown } from '@/components/LotteryCountdown';
import { TicketPurchase } from '@/components/TicketPurchase';
import { Trophy, Gift, Users, Sparkles } from 'lucide-react';

const MonthlyLottery = () => {
  // Launch date: 13th at 6 PM CET (18:00 CET)
  const launchDate = new Date('2025-01-13T18:00:00+01:00');
  const isPreOrder = new Date() < launchDate;
  
  // Mock SOL price - will be fetched from API
  const solPrice = 200;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-orbitron text-primary font-semibold">Monthly Lottery</span>
          </div>
          <h1 className="font-orbitron text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Monthly Jackpot
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The biggest prizes, the best odds. Win up to 60% of the total prize pool!
          </p>
        </div>

        {/* Countdown */}
        {isPreOrder && (
          <div className="max-w-2xl mx-auto">
            <LotteryCountdown targetDate={launchDate} />
          </div>
        )}

        {/* Prize Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-primary/30 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-orbitron text-2xl font-bold text-primary">60%</h3>
              <p className="text-muted-foreground">Jackpot Winner</p>
            </div>
          </div>

          <div className="bg-card border border-primary/30 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="font-orbitron text-2xl font-bold text-accent">5%</h3>
              <p className="text-muted-foreground">Second Place</p>
            </div>
          </div>

          <div className="bg-card border border-primary/30 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-orbitron text-2xl font-bold text-primary">5%</h3>
              <p className="text-muted-foreground">100 Random Winners</p>
            </div>
          </div>
        </div>

        {/* Ticket Purchase */}
        <div className="max-w-2xl mx-auto">
          <TicketPurchase 
            lotteryType="monthly" 
            isPreOrder={isPreOrder}
            solPrice={solPrice}
            showReferralInput={true}
          />
        </div>

        {/* Rules Section */}
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
                <p>Each ticket costs $1 USD (converted to SOL). Purchase as many as you want!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">2</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Pre-Order Bonus</h3>
                <p>Buy before the launch date and receive 2× tickets! That's double your chances to win!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">3</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Use Referral Codes</h3>
                <p>Enter an affiliate's referral code when purchasing to support your favorite creators!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">4</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Automatic Winner Selection</h3>
                <p>Winners are selected randomly and fairly on-chain. Prizes are sent automatically to winning wallets!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">5</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">70% Prize Pool</h3>
                <p>70% of all ticket sales go to the prize pool, distributed among winners.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MonthlyLottery;