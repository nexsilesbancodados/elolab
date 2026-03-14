-- ============================================================
-- EloLab: Chat Interno entre funcionários da clínica
-- ============================================================

-- Conversas entre dois usuários
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  participante_1_id uuid not null references auth.users(id) on delete cascade,
  participante_2_id uuid not null references auth.users(id) on delete cascade,
  ultima_mensagem_em timestamptz default now(),
  preview text,
  created_at timestamptz default now(),
  constraint chat_conversations_unique unique (participante_1_id, participante_2_id)
);

-- Mensagens individuais
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.chat_conversations(id) on delete cascade,
  remetente_id uuid not null references auth.users(id) on delete cascade,
  destinatario_id uuid not null references auth.users(id) on delete cascade,
  texto text not null check (length(texto) > 0),
  urgente boolean default false,
  lida_em timestamptz,
  created_at timestamptz default now()
);

-- Índices para performance
create index if not exists idx_chat_conv_p1 on public.chat_conversations(participante_1_id);
create index if not exists idx_chat_conv_p2 on public.chat_conversations(participante_2_id);
create index if not exists idx_chat_msgs_conv on public.chat_messages(conversa_id);
create index if not exists idx_chat_msgs_dest on public.chat_messages(destinatario_id);
create index if not exists idx_chat_msgs_created on public.chat_messages(created_at desc);

-- RLS
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

-- Políticas: cada usuário vê apenas suas próprias conversas/mensagens
drop policy if exists "chat_conv_policy" on public.chat_conversations;
create policy "chat_conv_policy"
  on public.chat_conversations for all
  using (auth.uid() = participante_1_id or auth.uid() = participante_2_id);

drop policy if exists "chat_msgs_policy" on public.chat_messages;
create policy "chat_msgs_policy"
  on public.chat_messages for all
  using (auth.uid() = remetente_id or auth.uid() = destinatario_id);

-- Realtime para mensagens novas
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'chat_conversations'
  ) then
    alter publication supabase_realtime add table public.chat_conversations;
  end if;
end $$;
