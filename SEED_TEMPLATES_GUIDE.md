# 🌱 Seed Email Templates - Guia de Execução

## Instruções para inserir os templates de email no Supabase

### Passo 1: Acesse o Supabase Dashboard
1. Vá para https://app.supabase.com
2. Selecione seu projeto EloLab
3. Clique em **SQL Editor** no menu lateral

### Passo 2: Copie e Cole o SQL
Abra o arquivo `supabase/seed-email-templates.sql` e copie TODO o conteúdo.

Cole no editor SQL do Supabase.

### Passo 3: Execute
Clique no botão **▶ Run** (ou Ctrl+Enter) para executar.

### Verificação
Após a execução, você verá:
✅ "3 rows inserted" (ou similar)

Vá até **Table Editor** → `notification_templates` para confirmar que os 3 templates foram inseridos:
- ✅ Confirmação de Consulta
- ✅ Resultado de Exame Disponível  
- ✅ Recibo de Pagamento

---

## Alternativa: Executar via API

Se preferir, execute este comando Node.js:

```bash
cd /c/Users/lopes/elolab
npm install @supabase/supabase-js --save
VITE_SUPABASE_URL="https://gebygucrpipaufrlyqqj.supabase.co" node seed-templates.js
```

Mas **você precisa da SUPABASE_SERVICE_ROLE_KEY** (encontre em Project Settings → API).

---

## ✨ Pronto!

Após completar qualquer uma das opções acima:
- Os templates estarão disponíveis para customização em `/templates-email`
- As automações enviarão emails com estes templates
- Clinicas podem editar o conteúdo sem código

🎉 **Sistema de automação completo e pronto para produção!**
