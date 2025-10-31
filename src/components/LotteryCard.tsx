import { motion } from 'framer-motion';
import { Clock, Ticket, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';

interface LotteryCardProps {
  title: string;
  description: string;
  ticketLimit?: number;
  prizePool: string;
  nextDraw: string;
  participants: number;
  index: number;
}

export function LotteryCard({
  title,
  description,
  ticketLimit,
  prizePool,
  nextDraw,
  participants,
  index,
}: LotteryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative bg-card border border-primary/30 rounded-2xl p-6 shadow-neon hover:border-primary/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-orbitron text-2xl font-bold text-primary mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {ticketLimit && (
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium">
              Limited
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Prize Pool</span>
            </div>
            <span className="text-2xl font-bold text-primary text-glow-purple">{prizePool}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Next Draw</span>
            </div>
            <span className="font-medium">{nextDraw}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Ticket className="w-4 h-4" />
              <span className="text-sm">Participants</span>
            </div>
            <span className="font-medium">{participants.toLocaleString()}</span>
          </div>

          {ticketLimit && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ticket Limit</span>
                <span className="font-medium text-accent">{ticketLimit} max</span>
              </div>
            </div>
          )}
        </div>

        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-neon">
          Pre-Order Tickets
        </Button>
      </div>
    </motion.div>
  );
}
