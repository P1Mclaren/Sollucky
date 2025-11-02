import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LotteryDraw {
  id: string;
  lottery_type: string;
  status: string;
  draw_date: string;
  start_date: string;
  end_date: string;
}

export function useActiveDraw(lotteryType: 'monthly' | 'weekly' | 'daily') {
  const [draw, setDraw] = useState<LotteryDraw | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveDraw = async () => {
      try {
        const { data, error } = await supabase
          .from('lottery_draws')
          .select('*')
          .eq('lottery_type', lotteryType)
          .in('status', ['active', 'pre-order'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        setDraw(data);
      } catch (error) {
        console.error('Error fetching active draw:', error);
        setDraw(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveDraw();

    // Subscribe to changes
    const channel = supabase
      .channel(`lottery_draws_${lotteryType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lottery_draws',
          filter: `lottery_type=eq.${lotteryType}`,
        },
        () => {
          fetchActiveDraw();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lotteryType]);

  return { draw, loading };
}
