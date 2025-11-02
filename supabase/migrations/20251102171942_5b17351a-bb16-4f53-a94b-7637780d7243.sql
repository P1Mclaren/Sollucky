-- Create lottery type enum
CREATE TYPE lottery_type AS ENUM ('monthly', 'weekly', 'daily');

-- Lottery draws table (each instance of a lottery)
CREATE TABLE public.lottery_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_type lottery_type NOT NULL,
  draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pre-order', -- pre-order, active, drawing, completed
  total_tickets_sold INTEGER DEFAULT 0,
  total_pool_lamports BIGINT DEFAULT 0,
  jackpot_lamports BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lottery draws"
  ON public.lottery_draws FOR SELECT
  USING (true);

CREATE POLICY "Service role manages draws"
  ON public.lottery_draws FOR ALL
  USING (false) WITH CHECK (false);

-- Individual lottery tickets with unique random codes
CREATE TABLE public.lottery_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.lottery_draws(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  ticket_code TEXT NOT NULL UNIQUE,
  is_bonus BOOLEAN DEFAULT false,
  transaction_signature TEXT,
  referral_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lottery_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lottery tickets"
  ON public.lottery_tickets FOR SELECT
  USING (true);

CREATE POLICY "Service role manages tickets"
  ON public.lottery_tickets FOR ALL
  USING (false) WITH CHECK (false);

-- Create index for faster lookups
CREATE INDEX idx_lottery_tickets_draw_id ON public.lottery_tickets(draw_id);
CREATE INDEX idx_lottery_tickets_wallet ON public.lottery_tickets(wallet_address);
CREATE INDEX idx_lottery_tickets_code ON public.lottery_tickets(ticket_code);

-- Winners table
CREATE TABLE public.lottery_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.lottery_draws(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.lottery_tickets(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  prize_tier TEXT NOT NULL,
  prize_lamports BIGINT NOT NULL,
  transaction_signature TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lottery_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view winners"
  ON public.lottery_winners FOR SELECT
  USING (true);

CREATE POLICY "Service role manages winners"
  ON public.lottery_winners FOR ALL
  USING (false) WITH CHECK (false);

CREATE INDEX idx_lottery_winners_draw_id ON public.lottery_winners(draw_id);
CREATE INDEX idx_lottery_winners_wallet ON public.lottery_winners(wallet_address);

-- SOL price cache table for dynamic pricing
CREATE TABLE public.sol_price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_usd DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sol_price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view SOL price"
  ON public.sol_price_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role updates price"
  ON public.sol_price_cache FOR ALL
  USING (false) WITH CHECK (false);