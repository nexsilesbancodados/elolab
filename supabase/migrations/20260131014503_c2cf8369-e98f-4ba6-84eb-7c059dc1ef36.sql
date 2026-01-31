-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert invitations" ON public.employee_invitations;
DROP POLICY IF EXISTS "Authenticated users can update invitations" ON public.employee_invitations;

-- Create more restrictive policies - only admins can manage invitations
CREATE POLICY "Admins can insert invitations"
ON public.employee_invitations
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update invitations"
ON public.employee_invitations
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));