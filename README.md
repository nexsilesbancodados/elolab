# EloLab — Sistema de Gestão Clínica Premium

Sistema completo de gestão para clínicas médicas. Stack: React 18 + TypeScript + Tailwind + shadcn/ui + Supabase + Framer Motion.

## 🚀 Módulos

### Clínica
| Módulo | Rota | Descrição |
|---|---|---|
| Dashboard | `/dashboard` | KPIs com sparklines, welcome banner, hoje em foco |
| Agenda | `/agenda` | Grade semanal + lista, stats do dia, recorrência |
| Pacientes | `/pacientes` | CRUD completo, CEP auto-fill, timeline, alergias |
| Fila de Atendimento | `/fila` | Cards animados, timer de espera, prioridade |
| Triagem | `/triagem` | Protocolo Manchester, sinais vitais, IMC calculado |
| Prontuários | `/prontuarios` | SOAP, prescrições, histórico de evoluções |
| Prescrições | `/prescricoes` | Templates, geração de PDF |
| Atestados | `/atestados` | Templates, geração de PDF |
| Exames | `/exames` | Catálogo de exames, preços por convênio |
| Laboratório | `/laboratorio` | Worklist, resultados, validação |
| Mapa de Coleta | `/mapa-coleta` | Tubos coloridos, FIFO, realtime |
| Laudos Lab | `/laudos-lab` | Liberação por exame, visualização de resultados |
| Encaminhamentos | `/encaminhamentos` | Classificação urgência, PDF |
| Retornos | `/retornos` | Controle de retornos, alertas de atraso |
| Triagem | `/triagem` | Manchester, vitais, IMC |
| Fila de Espera | `/lista-espera` | Lista de espera por procedimento |

### Financeiro
| Módulo | Rota | Descrição |
|---|---|---|
| Financeiro | `/financeiro` | CRUD lançamentos, gráficos, KPIs, export Excel |
| Contas a Receber | `/contas-receber` | Gestão de recebimentos |
| Contas a Pagar | `/contas-pagar` | Gestão de pagamentos |
| Fluxo de Caixa | `/fluxo-caixa` | Visão diária/mensal |
| Pagamentos MP | `/pagamentos` | Integração MercadoPago |
| Relatórios | `/relatorios` | Relatórios completos com gráficos e export |

### Operacional
| Módulo | Rota | Descrição |
|---|---|---|
| Médicos | `/medicos` | Cadastro com especialidade colorida |
| Funcionários | `/funcionarios` | CRUD, convites por email |
| Estoque | `/estoque` | Controle com alerta de estoque baixo |
| Convênios | `/convenios` | Cadastro de planos e valores |
| Salas | `/salas` | Gerenciamento de salas |
| Templates | `/templates` | Templates de documentos |
| Tarefas | `/tarefas` | Gestão de tarefas internas com prioridade |
| Preços Exames | `/precos-exames` | Tabela de preços por convênio |
| Painel TV | `/painel-tv` | Painel para sala de espera |

### Admin
| Módulo | Rota | Descrição |
|---|---|---|
| Analytics | `/analytics` | Métricas avançadas e tendências |
| Agente IA | `/agente-ia` | WhatsApp AI + sessões + conversas |
| Automações | `/automacoes` | Regras de automação |
| Planos | `/planos` | Gestão de planos/assinaturas |
| Configurações | `/configuracoes` | Configurações do sistema |
| Usuários | `/usuarios` | Gestão de usuários e permissões |

## 🆕 Novas Funcionalidades (integradas de Innfinitlab + GestãoPlan)

### Do Innfinitlab
- **Mapa de Coleta** — tubos coloridos por material biológico, ordem FIFO, realtime
- **Laudos Laboratoriais** — liberação por exame, modal de resultados detalhados

### Do GestãoPlan  
- **Chat Interno** — botão flutuante, conversas em tempo real entre funcionários, flag urgente

## 🔧 Setup

```bash
npm install
npm run dev
```

## 🗄️ Banco de Dados (Migrações pendentes)

Execute no Supabase SQL Editor:
1. `supabase/migrations/20260314220000_chat_interno_elolab.sql` — tabelas de chat
2. `supabase/migrations/20260314230001_feedbacks_nps.sql` — NPS pós-consulta

## ⚠️ Segurança

- `.env` contém chaves do Supabase — **NUNCA commitar** (já no .gitignore)
- Se o `.env` foi exposto: rotacionar chaves em Supabase Dashboard → Settings → API
- RLS habilitado em todas as tabelas

## 📱 PWA

App instalável com cache offline para dados do Supabase (5 min), storage (30 dias) e assets estáticos.

## 🎨 Design System

- **Cores**: primária azul-teal, sucesso verde esmeralda, warning âmbar, destructivo coral
- **Tipografia**: Inter (corpo) + Plus Jakarta Sans (títulos)
- **Animações**: Framer Motion em todas as páginas e componentes
- **Temas**: Light/Dark mode completo
