
-- Fix: Change MARIA APARECIDA's role from admin to medico (she is a doctor, not admin)
-- Her user_id: bdcdca71-3840-484f-8ea1-1e25f7b5e7f1
UPDATE public.user_roles 
SET role = 'medico' 
WHERE user_id = 'bdcdca71-3840-484f-8ea1-1e25f7b5e7f1' 
AND role = 'admin';

-- Also link her to the medicos table if she has a matching medico record
UPDATE public.medicos 
SET user_id = 'bdcdca71-3840-484f-8ea1-1e25f7b5e7f1' 
WHERE email = 'cidadiasbuffett@gmail.com' 
AND user_id IS NULL;
