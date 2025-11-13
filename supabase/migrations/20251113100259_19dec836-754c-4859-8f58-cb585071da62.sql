-- Create demo mode state table
CREATE TABLE IF NOT EXISTS public.demo_mode_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by text NOT NULL
);

-- Enable RLS
ALTER TABLE public.demo_mode_state ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view demo mode state"
ON public.demo_mode_state
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Only admins can update demo mode state"
ON public.demo_mode_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Insert initial state
INSERT INTO public.demo_mode_state (is_enabled, updated_by)
VALUES (false, 'system')
ON CONFLICT DO NOTHING;

-- Create demo transactions table
CREATE TABLE IF NOT EXISTS public.demo_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  ticket_count integer NOT NULL,
  lottery_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view demo transactions"
ON public.demo_transactions
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role manages demo transactions"
ON public.demo_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create demo winners table
CREATE TABLE IF NOT EXISTS public.demo_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  prize_lamports bigint NOT NULL,
  prize_tier text NOT NULL,
  lottery_type text NOT NULL,
  show_on_wall_of_fame boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_winners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view demo winners"
ON public.demo_winners
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role manages demo winners"
ON public.demo_winners
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);