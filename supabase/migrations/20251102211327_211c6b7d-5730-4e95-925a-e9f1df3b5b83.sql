-- Create lottery_fund_balances table to track per-lottery-type funds
CREATE TABLE IF NOT EXISTS public.lottery_fund_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_type text NOT NULL CHECK (lottery_type IN ('daily', 'weekly', 'monthly')),
  draw_id uuid REFERENCES public.lottery_draws(id) ON DELETE CASCADE,
  
  -- Fund tracking
  total_collected_lamports bigint NOT NULL DEFAULT 0,
  lottery_pool_lamports bigint NOT NULL DEFAULT 0, -- 70% for lottery
  operator_share_lamports bigint NOT NULL DEFAULT 0, -- 30% for operator
  creator_share_lamports bigint NOT NULL DEFAULT 0, -- 30% from creator codes (monthly only)
  referrer_share_lamports bigint NOT NULL DEFAULT 0, -- 25% from creator codes (monthly only)
  
  -- Payout tracking
  paid_to_winners_lamports bigint NOT NULL DEFAULT 0,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(lottery_type, draw_id)
);

-- Enable RLS
ALTER TABLE public.lottery_fund_balances ENABLE ROW LEVEL SECURITY;

-- Anyone can view fund balances
CREATE POLICY "Anyone can view lottery fund balances"
ON public.lottery_fund_balances
FOR SELECT
USING (true);

-- Service role manages fund balances
CREATE POLICY "Service role manages fund balances"
ON public.lottery_fund_balances
FOR ALL
USING (false)
WITH CHECK (false);

-- Create index for faster queries
CREATE INDEX idx_lottery_fund_balances_type ON public.lottery_fund_balances(lottery_type);
CREATE INDEX idx_lottery_fund_balances_draw_id ON public.lottery_fund_balances(draw_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_lottery_fund_balances_updated_at
BEFORE UPDATE ON public.lottery_fund_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.lottery_fund_balances REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lottery_fund_balances;