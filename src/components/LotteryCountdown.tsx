import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface LotteryCountdownProps {
  targetDate: Date;
  onCountdownEnd?: () => void;
}

export function LotteryCountdown({ targetDate, onCountdownEnd }: LotteryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onCountdownEnd?.();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onCountdownEnd]);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card border border-primary/30 rounded-2xl">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="w-6 h-6" />
        <h3 className="font-orbitron text-xl font-bold">Time Until Launch</h3>
      </div>
      
      <div className="grid grid-cols-4 gap-4 w-full">
        <div className="flex flex-col items-center">
          <div className="text-4xl font-orbitron font-bold text-primary">
            {timeLeft.days.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Days</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-orbitron font-bold text-primary">
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Hours</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-orbitron font-bold text-primary">
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Minutes</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-orbitron font-bold text-primary">
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Seconds</div>
        </div>
      </div>
    </div>
  );
}