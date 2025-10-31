import { motion } from 'framer-motion';
import { Clock, Ticket, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';

interface LotteryCardProps {
  title: string;
  description: string;
  ticketLimit?: number;
  status: 'pre-order' | 'coming-soon';
  nextDraw: string;
  index: number;
}

export function LotteryCard({
  title,
  description,
  ticketLimit,
  status,
  nextDraw,
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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
      
      <div className="relative bg-card border border-primary/30 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-orbitron text-2xl font-bold text-primary mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className={`px-3 py-1 rounded-full border text-xs font-medium ${
            status === 'pre-order' 
              ? 'bg-primary/10 border-primary/30 text-primary' 
              : 'bg-muted/10 border-muted/30 text-muted-foreground'
          }`}>
            {status === 'pre-order' ? 'Pre-Order Available' : 'Coming Soon'}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Launch</span>
            </div>
            <span className="font-medium text-accent">{nextDraw}</span>
          </div>

          {ticketLimit && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Ticket className="w-4 h-4" />
                <span className="text-sm">Ticket Limit</span>
              </div>
              <span className="font-medium">{ticketLimit} max</span>
            </div>
          )}

          {status === 'pre-order' && (
            <div className="pt-2 border-t border-primary/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pre-Order Bonus</span>
                <span className="font-bold text-primary">2× Tickets</span>
              </div>
            </div>
          )}
        </div>

        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={status === 'coming-soon'}
          onClick={() => document.getElementById('pre-order')?.scrollIntoView({ behavior: 'smooth' })}
        >
          {status === 'pre-order' ? 'Pre-Order Now' : 'Coming Soon'}
        </Button>
      </div>
    </motion.div>
  );
}
