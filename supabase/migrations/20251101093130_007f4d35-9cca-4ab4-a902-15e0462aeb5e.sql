-- Fix security warning: Set search_path for increment_connection_count function
CREATE OR REPLACE FUNCTION public.increment_connection_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.connection_count = COALESCE(OLD.connection_count, 0) + 1;
  RETURN NEW;
END;
$$;