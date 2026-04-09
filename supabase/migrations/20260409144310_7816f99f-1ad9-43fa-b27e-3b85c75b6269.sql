
-- Add cpf_cnpj column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf_cnpj text;

-- Update the trigger function to capture telefone and cpf_cnpj from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone, cpf_cnpj)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'telefone',
    NEW.raw_user_meta_data->>'cpf_cnpj'
  );
  
  RETURN NEW;
END;
$$;
