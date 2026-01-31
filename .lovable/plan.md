# Plano de Automações para o EloLab

## Status de Implementação

| Automação | Status | Detalhes |
|-----------|--------|----------|
| **Fase 1** | ✅ Concluída | |
| Lembretes de consulta (24h/2h) | ✅ Implementado | Edge Function `send-appointment-reminder` |
| Faturamento automático | ✅ Implementado | Trigger `auto_billing_on_appointment_complete` |
| Alertas de estoque | ✅ Implementado | Edge Function `stock-alert` + Trigger `check_critical_stock` |
| Processamento de fila | ✅ Implementado | Edge Function `process-notification-queue` |
| **Fase 2** | ⏳ Pendente | |
| Fluxo de chegada | ⏳ Pendente | |
| Notificação de exames | ⏳ Pendente | |
| Relatórios mensais | ⏳ Pendente | |
| **Fase 3** | ⏳ Pendente | |
| WhatsApp Business | ⏳ Pendente | Requer Twilio/Z-API |
| Aniversariantes | ⏳ Pendente | Template já criado |
| Backup automático | ⏳ Pendente | |
| **Fase 4** | ⏳ Pendente | |
| Assistente IA prontuários | ⏳ Pendente | Requer LOVABLE_API_KEY (já configurada) |

---

## Infraestrutura Implementada

### Tabelas Criadas
- `notification_templates` - Templates de mensagens (5 templates pré-configurados)
- `notification_queue` - Fila de notificações pendentes
- `automation_logs` - Log de execução das automações
- `automation_settings` - Configurações das automações

### Edge Functions Ativas
1. `send-appointment-reminder` - Envia lembretes 24h e 2h antes das consultas
2. `stock-alert` - Verifica e notifica itens com estoque crítico
3. `process-notification-queue` - Processa fila de notificações pendentes

### Triggers de Banco de Dados
1. `trigger_auto_billing` - Cria lançamento financeiro ao finalizar consulta
2. `trigger_check_critical_stock` - Adiciona alerta à fila quando estoque fica crítico

---

## Como Agendar Execução Automática (Cron)

Para que as automações rodem automaticamente, execute este SQL no Supabase:

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Lembretes de consulta: rodar a cada hora
SELECT cron.schedule(
  'appointment-reminders-hourly',
  '0 * * * *', -- A cada hora
  $$
  SELECT net.http_post(
    url := 'https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/send-appointment-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Alertas de estoque: rodar diariamente às 8h
SELECT cron.schedule(
  'stock-alerts-daily',
  '0 8 * * *', -- Todo dia às 8h
  $$
  SELECT net.http_post(
    url := 'https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/stock-alert',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Processar fila de notificações: rodar a cada 5 minutos
SELECT cron.schedule(
  'process-notifications',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/process-notification-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

## Próximos Passos

1. **Fase 2**: Implementar fluxo de chegada, notificação de exames e relatórios mensais
2. **Fase 3**: Configurar integração WhatsApp com Twilio/Z-API
3. **Fase 4**: Implementar assistente IA para prontuários

---

## Visão Geral

Após análise completa do sistema, identifiquei **12 automações de alto impacto** organizadas em 4 categorias: Atendimento, Comunicação, Financeiro e Operacional.

---

## 1. Automações de Atendimento ao Paciente

### 1.1 Confirmação Automática de Consultas via WhatsApp/SMS
- **O que faz**: Envia mensagem automática 24h antes da consulta pedindo confirmação
- **Benefício**: Reduz faltas em até 40%, libera horários para outros pacientes
- **Como funciona**: Cron job diário verifica agendamentos do dia seguinte e dispara notificações

### 1.2 Fluxo Inteligente de Chegada
- **O que faz**: Quando paciente chega na recepção, automaticamente:
  1. Adiciona à fila de atendimento
  2. Notifica a enfermagem para triagem
  3. Atualiza o painel TV em tempo real
  4. Envia SMS ao paciente quando for chamado
- **Benefício**: Elimina filas desorganizadas e melhora a experiência

### 1.3 Auto-Agendamento de Retornos
- **O que faz**: Ao finalizar consulta, se médico indicar retorno, sistema sugere automaticamente datas disponíveis
- **Benefício**: Aumenta taxa de retorno, melhora acompanhamento

---

## 2. Automações de Comunicação

### 2.1 Lembretes Inteligentes por E-mail/WhatsApp
- **Disparos automáticos**:
  - 7 dias antes: "Sua consulta está próxima"
  - 1 dia antes: "Lembrete de consulta amanhã às X"
  - 2 horas antes: "Não esqueça sua consulta hoje"
  - Pós-consulta: "Como foi seu atendimento?"

### 2.2 Notificação de Resultados de Exames
- **O que faz**: Quando laudo é anexado ao sistema, paciente recebe SMS/e-mail automaticamente
- **Benefício**: Paciente não precisa ligar para saber se resultado está pronto

### 2.3 Aniversariantes do Mês
- **O que faz**: Envia mensagem de aniversário automática para pacientes
- **Benefício**: Fidelização e relacionamento

---

## 3. Automações Financeiras

### 3.1 Faturamento Automático por Consulta
- **O que faz**: Ao finalizar atendimento, cria automaticamente lançamento de receita
- **Benefício**: Nunca mais esquecer de lançar uma consulta

### 3.2 Alertas de Contas a Vencer
- **O que faz**: Notifica o financeiro sobre:
  - Contas a pagar vencendo em 3 dias
  - Pagamentos de pacientes em atraso
  - Repasses de convênios pendentes
- **Benefício**: Evita multas e melhora fluxo de caixa

### 3.3 Geração Automática de Relatórios
- **O que faz**: Todo dia 1° do mês, gera e envia por e-mail:
  - Faturamento do mês anterior
  - Comparativo com meses anteriores
  - Procedimentos mais realizados
  - Médicos com mais atendimentos

---

## 4. Automações Operacionais

### 4.1 Alertas de Estoque Crítico
- **O que faz**: Quando item atinge estoque mínimo, notifica responsável automaticamente
- **Disparo**: E-mail + notificação push no sistema
- **Extra**: Sugere quantidade de reposição baseado em histórico

### 4.2 Prontuário Pré-Preenchido com IA
- **O que faz**: Usa Lovable AI para:
  - Sugerir hipótese diagnóstica baseada nos sintomas
  - Preencher campos comuns automaticamente
  - Alertar sobre interações medicamentosas nas prescrições
- **Benefício**: Médico ganha tempo, reduz erros

### 4.3 Backup Automático Diário
- **O que faz**: Exporta dados críticos diariamente para storage seguro
- **Benefício**: Proteção contra perda de dados

---

## Implementação Técnica

### Edge Functions Necessárias

```text
supabase/functions/
├── send-appointment-reminder/     ✅ Implementado
├── stock-alert/                   ✅ Implementado
├── process-notification-queue/    ✅ Implementado
├── send-whatsapp-notification/    ⏳ Pendente (Twilio/Z-API)
├── exam-result-notification/      ⏳ Pendente
├── monthly-report-generator/      ⏳ Pendente
├── ai-medical-assistant/          ⏳ Pendente
└── birthday-greetings/            ⏳ Pendente
```

### Database: Novas Tabelas

```text
✅ notification_queue          # Fila de notificações pendentes
✅ notification_templates      # Templates de mensagens
✅ automation_logs            # Log de execução das automações
✅ automation_settings        # Configurações de automação
```

### Integrações Externas Sugeridas

| Serviço | Uso | Status |
|---------|-----|--------|
| Resend | E-mails transacionais | ✅ Configurado |
| Twilio/Z-API | WhatsApp Business | ⏳ Não configurado |
| Lovable AI | Assistente médico IA | ✅ Disponível |

---

## Priorização Recomendada

| Fase | Automações | Status |
|------|------------|--------|
| **Fase 1** | Lembretes de consulta, Faturamento automático, Alertas de estoque | ✅ Concluída |
| **Fase 2** | Fluxo de chegada, Notificação de exames, Relatórios mensais | ⏳ Pendente |
| **Fase 3** | WhatsApp Business, Aniversariantes, Backup automático | ⏳ Pendente |
| **Fase 4** | Assistente IA para prontuários | ⏳ Pendente |
