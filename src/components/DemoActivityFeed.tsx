import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DemoTransaction {
  id: string;
  wallet_address: string;
  ticket_count: number;
  lottery_type: string;
  created_at: string;
}

export function DemoActivityFeed() {
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);

  useEffect(() => {
    fetchTransactions();

    // Subscribe to new demo transactions
    const channel = supabase
      .channel('demo_transactions_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'demo_transactions',
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('demo_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setTransactions(data);
    }
  };

  const truncateWallet = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getLotteryColor = (type: string) => {
    switch (type) {
      case 'monthly':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'weekly':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'daily':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Recent Demo Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No demo activity yet
            </p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <Badge className={getLotteryColor(tx.lottery_type)}>
                    {tx.lottery_type}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {truncateWallet(tx.wallet_address)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.ticket_count} ticket{tx.ticket_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}