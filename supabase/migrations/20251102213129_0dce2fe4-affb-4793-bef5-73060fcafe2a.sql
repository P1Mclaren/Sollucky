-- Fix audit_log RLS policy to allow admins to view logs

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Only admins can view audit log" ON public.audit_log;

-- Create a proper policy that allows admins to view audit logs
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.wallet_address = audit_log.admin_wallet
        AND user_roles.role = 'admin'
    )
  );