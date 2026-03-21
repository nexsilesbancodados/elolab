

# Plano: Auditoria Completa + Correções + Melhorias de UX

## Visao Geral

Revisao sistematica de todos os modulos do EloLab, corrigindo bugs de uso, inconsistencias e melhorando drasticamente a experiencia do usuario.

---

## Fase 1 — Bugs Criticos e Problemas de Funcionamento

### 1.1 Faturamento Duplicado (Auto-Billing)
- O trigger `auto_billing_on_appointment_complete` no banco E o `createAutoBilling()` no codigo podem gerar lancamentos duplicados em race conditions
- **Correcao**: Remover o trigger do banco (migration) e manter apenas o `createAutoBilling()` no codigo, que ja tem check de duplicata (`existing.length > 0`)

### 1.2 Realtime Channel Error
- Console mostra `CHANNEL_ERROR` repetidamente — o hook `useRealtimeSubscription` ja faz fallback para polling, mas gera spam de warnings
- **Correcao**: Silenciar o warning apos o primeiro ocorrencia e adicionar exponential backoff

### 1.3 Prontuarios nao acessivel para medicos na sidebar
- O menu lateral mostra Prontuarios apenas para admin/medico, mas a rota existe — o item nao esta no sidebarMenu
- **Correcao**: Verificar se `Prontuarios`, `Prescricoes`, `Atestados`, `Encaminhamentos` estao no menu (eles foram consolidados dentro de Pacientes, mas as rotas independentes ainda existem)

### 1.4 GlobalSearch referencia paginas que nao existem mais
- O GlobalSearch.tsx lista `/prontuarios`, `/prescricoes`, `/atestados` como paginas separadas — precisa alinhar com o menu atual

---

## Fase 2 — Melhorias de UX Criticas

### 2.1 Feedback Visual em Acoes
- Adicionar `toast` de sucesso/erro consistente em TODOS os formularios (Agenda, Pacientes, Estoque, Triagem, Fila)
- Usar `LoadingButton` em vez de `Button` + estado loading manual em todos os forms

### 2.2 Confirmacao em Acoes Destrutivas
- Garantir que deletar paciente, cancelar agendamento, excluir item do estoque usam `ConfirmDialog` ou `AlertDialog`
- Verificar cada modulo: Pacientes, Agenda, Estoque, Contas, Fila

### 2.3 Empty States Melhores
- Verificar que todos os modulos com listas vazias exibem um `EmptyState` amigavel com acao primaria (ex: "Nenhum paciente cadastrado — Cadastrar Primeiro Paciente")
- Modulos a verificar: Triagem, Laboratorio, Prescricoes, Atestados, Encaminhamentos, Contas a Pagar

### 2.4 Validacao de Formularios
- CPF: adicionar validacao de digito verificador (nao apenas length)
- Telefone: mascara automatica
- Email: feedback visual inline
- Campos obrigatorios com asterisco vermelho
- Focar no primeiro campo com erro apos submit

### 2.5 Navegacao e Breadcrumbs
- Garantir que o botao "Voltar" funcione em todos os contextos de ficha/detalhe
- Breadcrumbs devem refletir a hierarquia real (ex: Pacientes > Joao > Prontuario)

---

## Fase 3 — Polimento de Interface

### 3.1 Transicoes e Animacoes
- Adicionar `animate-fade-in` nos modulos que ainda nao tem (verificar Triagem, Laboratorio, Contas)
- Skeleton loaders em todos os modulos com dados async

### 3.2 Responsividade Mobile
- Verificar que tabelas largas usam `ScrollArea` horizontal em telas pequenas
- Cards de KPI empilham corretamente em mobile
- Dialogs de formulario nao cortam em telas menores

### 3.3 Acessibilidade
- Labels em todos os inputs de formulario
- `aria-label` em botoes de icone
- Focus trap em dialogs (ja coberto pelo Radix, mas verificar)

### 3.4 Consistencia Visual
- Padronizar uso de `rounded-xl` vs `rounded-lg` em cards
- Padronizar espacamento de header de pagina (titulo + descricao + acao)
- Padronizar cores de status entre modulos (verde=sucesso, amarelo=pendente, vermelho=erro)

---

## Fase 4 — Funcionalidades Faltantes

### 4.1 Configuracoes na Nuvem
- O `Configuracoes.tsx` ja usa Supabase (tabela `configuracoes_clinica`) — verificar se o save funciona e se carrega corretamente ao reabrir

### 4.2 Pagina de Recepcao — Fluxo Completo
- Verificar que o fluxo Check-in > Triagem > Atendimento > Pagamento funciona de ponta a ponta
- Testar transicao de status do agendamento em cada etapa

### 4.3 Medicos sem acesso a Prontuario direto
- Adicionar rota de prontuario no menu clinico para medicos (atualmente so acessivel via ficha de paciente)

---

## Detalhes Tecnicos

```text
Arquivos principais afetados:
├── src/hooks/useRealtimeSubscription.ts  (silenciar spam)
├── src/lib/autoBilling.ts                (manter, remover trigger DB)
├── src/config/sidebarMenu.ts             (ajustar itens clinicos)
├── src/components/GlobalSearch.tsx        (alinhar com menu)
├── src/pages/Pacientes.tsx               (validacao CPF, UX)
├── src/pages/Agenda.tsx                   (confirm dialogs)
├── src/pages/Estoque.tsx                  (empty states)
├── src/pages/Triagem.tsx                  (animacoes, skeleton)
├── src/pages/Recepcao.tsx                 (fluxo completo)
├── src/pages/Prescricoes.tsx              (consistencia)
├── src/pages/Atestados.tsx                (consistencia)
├── src/pages/Laboratorio.tsx              (empty states)
├── src/pages/ContasPagar.tsx              (UX)
├── src/pages/ContasReceber.tsx            (UX)
├── migration: remover trigger duplicado
└── ~15 arquivos menores de ajuste
```

**Estimativa**: ~8-10 mensagens de implementacao sequencial, priorizando bugs criticos primeiro.

