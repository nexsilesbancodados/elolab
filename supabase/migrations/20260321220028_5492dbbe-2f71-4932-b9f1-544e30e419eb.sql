-- Remove the trigger that duplicates billing logic
DROP TRIGGER IF EXISTS trigger_auto_billing ON public.agendamentos;
-- Keep the function but it won't fire automatically anymore
-- The createAutoBilling() in the frontend handles billing with better price logic