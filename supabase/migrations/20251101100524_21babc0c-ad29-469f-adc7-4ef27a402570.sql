-- Add table to track processed transaction signatures to prevent replay attacks
CREATE TABLE IF NOT EXISTS public.processed_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_signature TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL,
  ticket_count INTEGER NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT positive_amount CHECK (amount_lamports > 0),
  CONSTRAINT positive_tickets CHECK (ticket_count > 0)
);

-- Enable RLS on processed_transactions
ALTER TABLE public.processed_transactions ENABLE ROW LEVEL SECURITY;

-- Public can view to check if a transaction was already processed (transparency)
CREATE POLICY "Public can view processed transactions"
  ON public.processed_transactions
  FOR SELECT
  USING (true);

-- Only service role can insert (Edge Function only)
CREATE POLICY "Service role can insert processed transactions"
  ON public.processed_transactions
  FOR INSERT
  WITH CHECK (false);

-- Create index for fast duplicate signature lookups
CREATE INDEX IF NOT EXISTS idx_processed_transactions_signature 
  ON public.processed_transactions(transaction_signature);