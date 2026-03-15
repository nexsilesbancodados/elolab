-- ============================================================
-- EloLab: NPS Feedback Pós-Consulta
-- ============================================================

create table if not exists public.feedbacks_nps (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references public.pacientes(id) on delete set null,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  medico_id uuid references public.medicos(id) on delete set null,
  nota integer not null check (nota between 1 and 10),
  comentario text,
  categoria text check (categoria in ('atendimento','espera','estrutura','medico','geral')),
  created_at timestamptz default now()
);

-- RLS
alter table public.feedbacks_nps enable row level security;

drop policy if exists "nps_insert_policy" on public.feedbacks_nps;
create policy "nps_insert_policy"
  on public.feedbacks_nps for insert
  with check (true); -- anyone with valid token can insert

drop policy if exists "nps_select_policy" on public.feedbacks_nps;
create policy "nps_select_policy"
  on public.feedbacks_nps for select
  using (true); -- admins read via service role

-- View for NPS summary by month
create or replace view public.nps_resumo_mensal as
select
  date_trunc('month', created_at) as mes,
  count(*) as total,
  round(avg(nota)::numeric, 2) as media,
  count(*) filter (where nota >= 9) as promotores,
  count(*) filter (where nota between 7 and 8) as neutros,
  count(*) filter (where nota <= 6) as detratores,
  round(
    (count(*) filter (where nota >= 9)::float - count(*) filter (where nota <= 6)::float) 
    / nullif(count(*), 0) * 100
  ) as nps_score
from public.feedbacks_nps
group by date_trunc('month', created_at)
order by mes desc;

-- Índices
create index if not exists idx_nps_paciente on public.feedbacks_nps(paciente_id);
create index if not exists idx_nps_created on public.feedbacks_nps(created_at desc);
