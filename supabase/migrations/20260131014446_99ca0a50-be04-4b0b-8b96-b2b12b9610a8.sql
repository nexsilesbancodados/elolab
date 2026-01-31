-- Create table to store employee invitations
CREATE TABLE public.employee_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  roles public.app_role[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view/manage invitations
CREATE POLICY "Authenticated users can view invitations"
ON public.employee_invitations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert invitations"
ON public.employee_invitations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update invitations"
ON public.employee_invitations
FOR UPDATE
TO authenticated
USING (true);

-- Index for faster token lookups
CREATE INDEX idx_employee_invitations_token ON public.employee_invitations(token);
CREATE INDEX idx_employee_invitations_email ON public.employee_invitations(email);