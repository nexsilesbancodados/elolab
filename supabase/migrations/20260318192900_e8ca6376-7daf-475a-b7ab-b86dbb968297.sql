-- Enable realtime on key tables for instant UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.fila_atendimento;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_queue;