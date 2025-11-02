-- Create test_mode_state table to track global test mode
CREATE TABLE IF NOT EXISTS public.test_mode_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by text NOT NULL
);

-- Create audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  action_details jsonb,
  admin_wallet text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create test_lottery_runs table for tracking test lottery runs
CREATE TABLE IF NOT EXISTS public.test_lottery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_type text NOT NULL,
  status text NOT NULL DEFAULT 'IDLE',
  started_at timestamp with time zone,
  stopped_at timestamp with time zone,
  duration_minutes integer NOT NULL DEFAULT 5,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_mode_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_lottery_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_mode_state
CREATE POLICY "Anyone can view test mode state"
  ON public.test_mode_state
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update test mode state"
  ON public.test_mode_state
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- RLS policies for audit_log
CREATE POLICY "Only admins can view audit log"
  ON public.audit_log
  FOR SELECT
  USING (false);

CREATE POLICY "Service role manages audit log"
  ON public.audit_log
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- RLS policies for test_lottery_runs
CREATE POLICY "Anyone can view test lottery runs"
  ON public.test_lottery_runs
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage test lottery runs"
  ON public.test_lottery_runs
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Insert initial test mode state
INSERT INTO public.test_mode_state (is_enabled, updated_by)
VALUES (false, 'system')
ON CONFLICT DO NOTHING;