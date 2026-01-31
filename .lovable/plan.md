# Plano de Automações para o EloLab

## ✅ TODAS AS AUTOMAÇÕES IMPLEMENTADAS

| Automação | Status | Implementação |
|-----------|--------|---------------|
| **FASE 1** | ✅ 100% | |
| Lembretes de consulta (24h/2h) | ✅ | Edge Function `send-appointment-reminder` |
| Faturamento automático | ✅ | Trigger `auto_billing_on_appointment_complete` |
| Alertas de estoque | ✅ | Edge Function `stock-alert` + Trigger |
| **FASE 2** | ✅ 100% | |
| Notificação de exames | ✅ | Trigger `notify_exam_result_available` |
| Relatórios mensais | ✅ | Edge Function `monthly-report-generator` |
| **FASE 3** | ✅ 100% | |
| Aniversariantes | ✅ | Edge Function `birthday-greetings` |
| Processador de fila | ✅ | Edge Function `process-notification-queue` |
| **FASE 4** | ✅ 100% | |
| Assistente IA Médico | ✅ | Edge Function `ai-medical-assistant` |

---

## Edge Functions Disponíveis

| Função | Descrição | Testada |
|--------|-----------|---------|
| `send-employee-invitation` | Convites de funcionários | ✅ |
| `send-appointment-reminder` | Lembretes 24h e 2h | ✅ |
| `stock-alert` | Alertas de estoque crítico | ✅ |
| `process-notification-queue` | Processa fila de notificações | ✅ |
| `monthly-report-generator` | Relatórios mensais com métricas | ✅ |
| `birthday-greetings` | Mensagens de aniversário | ✅ |
| `ai-medical-assistant` | IA para diagnósticos e interações | ✅ |

---

## Triggers Automáticos no Banco

| Trigger | Tabela | Ação |
|---------|--------|------|
| `trigger_auto_billing` | `agendamentos` | Cria lançamento ao finalizar |
| `trigger_check_critical_stock` | `estoque` | Alerta quando estoque baixo |
| `trigger_notify_exam_result` | `exames` | Notifica quando laudo disponível |

---

## Configurações de Automação

As configurações estão em `automation_settings`:
- `lembrete_consulta_24h` - Ativo
- `lembrete_consulta_2h` - Ativo
- `alerta_estoque_critico` - Ativo
- `faturamento_automatico` - Ativo
- `aniversariantes` - Ativo

---

## Como Agendar Execução Automática (Cron)

Execute este SQL no Supabase SQL Editor para agendar as automações:

```sql
-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Lembretes de consulta: a cada hora
SELECT cron.schedule(
  'appointment-reminders',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/send-appointment-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb
  );$$
);

-- Alertas de estoque: diário às 8h
SELECT cron.schedule(
  'stock-alerts',
  '0 8 * * *',
  $$SELECT net.http_post(
    url := 'https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/stock-alert',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb
  );$$
);

-- Processar fila: a cada 5 minutos
SELECT cron.schedule(
  'process-notifications',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := 'https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/process-notification-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb
  );$$
);

-- Aniversariantes: diário às 9h
SELECT cron.schedule(
  'birthday-greetings',
  '0 9 * * *',
  $$SELECT net.http_post(
    url := 'https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/birthday-greetings',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb
  );$$
);

-- Relatório mensal: dia 1 às 6h
SELECT cron.schedule(
  'monthly-report',
  '0 6 1 * *',
  $$SELECT net.http_post(
    url := 'https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/monthly-report-generator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb
  );$$
);
```

---

## Assistente IA Médico

O `ai-medical-assistant` oferece 3 funcionalidades:

### 1. Sugestão de Diagnóstico
```json
{
  "action": "suggest_diagnosis",
  "data": {
    "queixa_principal": "Dor de cabeça intensa",
    "historia_doenca_atual": "Cefaleia frontal, pulsátil, com fotofobia",
    "exames_fisicos": "PA 120/80, FC 78"
  }
}
```

### 2. Verificação de Interações
```json
{
  "action": "check_interactions",
  "data": {
    "medicamentos": ["Dipirona 500mg", "Ibuprofeno 600mg"],
    "alergias": ["AAS"]
  }
}
```

### 3. Sugestão de Prescrição
```json
{
  "action": "fill_prescription",
  "data": {
    "diagnostico": "Migrânea sem aura"
  }
}
```

---

## Próximas Melhorias (Opcionais)

1. **WhatsApp Business**: Integrar com Twilio ou Z-API para notificações via WhatsApp
2. **Backup Automático**: Exportar dados diariamente para storage seguro
3. **Dashboard de Automações**: Criar tela para visualizar logs e configurações
4. **Mais Templates**: Adicionar templates personalizados de notificação
