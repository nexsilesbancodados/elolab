-- Add pending_roles column to funcionarios for pre-account role storage
ALTER TABLE public.funcionarios
ADD COLUMN pending_roles public.app_role[] NOT NULL DEFAULT '{}'::public.app_role[];

-- Backfill from existing user_roles where user_id is linked
UPDATE public.funcionarios f
SET pending_roles = (
  SELECT COALESCE(array_agg(ur.role), '{}'::public.app_role[])
  FROM public.user_roles ur
  WHERE ur.user_id = f.user_id
)
WHERE f.user_id IS NOT NULL;