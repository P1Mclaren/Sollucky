-- Create function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create tickets table to store ticket balances with transaction verification
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  ticket_count integer NOT NULL DEFAULT 0,
  bonus_tickets integer NOT NULL DEFAULT 0,
  transaction_signature text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tickets_wallet_unique UNIQUE (wallet_address),
  CONSTRAINT tickets_count_non_negative CHECK (ticket_count >= 0 AND bonus_tickets >= 0)
);

-- Create index for faster wallet lookups
CREATE INDEX idx_tickets_wallet ON public.tickets(wallet_address);

-- Enable RLS on tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow public to view tickets
CREATE POLICY "Public can view tickets"
ON public.tickets
FOR SELECT
USING (true);

-- Add trigger to update timestamps on tickets table
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies on wallet_connections
DROP POLICY IF EXISTS "Anyone can view wallet connections" ON public.wallet_connections;
DROP POLICY IF EXISTS "Anyone can insert wallet connections" ON public.wallet_connections;
DROP POLICY IF EXISTS "Anyone can update wallet connections" ON public.wallet_connections;

CREATE POLICY "Allow wallet connection tracking"
ON public.wallet_connections
FOR ALL
USING (true)
WITH CHECK (true);

-- Update RLS policies on referral_codes
DROP POLICY IF EXISTS "Anyone can view referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can create their own referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral code" ON public.referral_codes;

CREATE POLICY "Public can view referral codes for validation"
ON public.referral_codes
FOR SELECT
USING (true);

CREATE POLICY "Allow referral code creation"
ON public.referral_codes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Prevent referral code updates"
ON public.referral_codes
FOR UPDATE
USING (false);

-- Update RLS policies on referrals
DROP POLICY IF EXISTS "Anyone can view referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anyone can create referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anyone can update referrals" ON public.referrals;

CREATE POLICY "Public can view referrals"
ON public.referrals
FOR SELECT
USING (true);

CREATE POLICY "Allow referral creation"
ON public.referrals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Prevent referral updates"
ON public.referrals
FOR UPDATE
USING (false);

-- Add constraints to referral_codes
ALTER TABLE public.referral_codes
ADD CONSTRAINT referral_codes_code_unique UNIQUE (code);

ALTER TABLE public.referral_codes
ADD CONSTRAINT referral_codes_wallet_unique UNIQUE (wallet_address);

ALTER TABLE public.referral_codes
ADD CONSTRAINT referral_code_format_check CHECK (code ~ '^[A-Z0-9]{6,12}$');