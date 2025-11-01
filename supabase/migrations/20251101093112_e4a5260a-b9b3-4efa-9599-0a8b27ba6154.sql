-- Create wallet_connections table to track wallet usage
CREATE TABLE public.wallet_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_name TEXT,
  last_connected TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  connection_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_connections
CREATE POLICY "Anyone can view wallet connections"
  ON public.wallet_connections
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert wallet connections"
  ON public.wallet_connections
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update wallet connections"
  ON public.wallet_connections
  FOR UPDATE
  USING (true);

-- Create index for better performance
CREATE INDEX idx_wallet_connections_address ON public.wallet_connections(wallet_address);
CREATE INDEX idx_wallet_connections_last_connected ON public.wallet_connections(last_connected DESC);

-- Create function to increment connection count
CREATE OR REPLACE FUNCTION public.increment_connection_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.connection_count = COALESCE(OLD.connection_count, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment connection count on update
CREATE TRIGGER increment_wallet_connection_count
BEFORE UPDATE ON public.wallet_connections
FOR EACH ROW
EXECUTE FUNCTION public.increment_connection_count();