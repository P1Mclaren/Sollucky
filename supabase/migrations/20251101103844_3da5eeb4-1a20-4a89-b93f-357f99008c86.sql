-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wallet_address, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow public to check roles (read-only)
CREATE POLICY "Anyone can view roles"
ON public.user_roles
FOR SELECT
USING (true);

-- Only service role can manage roles
CREATE POLICY "Service role manages roles"
ON public.user_roles
FOR ALL
USING (false)
WITH CHECK (false);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_wallet text, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE wallet_address = _wallet
      AND role = _role
  )
$$;

-- Insert the current admin wallet
INSERT INTO public.user_roles (wallet_address, role)
VALUES ('HJJEjQRRzCkx7B9j8JABQjTxn7dDCnMdZLnynDLN3if5', 'admin');