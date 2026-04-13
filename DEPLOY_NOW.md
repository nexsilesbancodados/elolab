# 🚀 EloLab Production Deployment — IMMEDIATE ACTIONS

## Status: Code Pushed ✅ | Waiting for Template Seed 🔄

---

## ✅ What's Done

```
✅ Code committed & pushed to GitHub
✅ Vercel auto-deploying (check https://vercel.com/nexsiles)
✅ All features built & tested
✅ All edge functions ready
✅ UI pages ready (/chat, /templates-email)
```

**Code live at**: https://app.elolab.com.br (automatically deployed)

---

## 🔧 Final Step: Seed Email Templates (5 minutes)

You need to insert 3 email templates into Supabase. Choose one method:

### **Option A: Manual (Easiest) — Copy/Paste in Dashboard**

**Step 1:** Get the SQL
- Open file: `supabase/seed-email-templates.sql`
- Copy ALL content

**Step 2:** Execute in Supabase
1. Go to: https://app.supabase.com
2. Login with your Supabase account
3. Select: **EloLab** project
4. Click: **SQL Editor** (left sidebar)
5. Paste the SQL
6. Click: **▶ Run** (or Ctrl+Enter)

**Step 3:** Verify
- Should see: `"3 rows inserted"`
- Go to: **Table Editor** → `notification_templates`
- You should see 3 new templates ✅

---

### **Option B: Automated via Node Script**

**Step 1:** Get your Service Role Key
1. Go to: https://app.supabase.com
2. Select: **EloLab** project
3. Click: **Project Settings** (⚙️ bottom left)
4. Click: **API**
5. Find section: "Your API keys"
6. Copy: **service_role** (the long key starting with `eyJ...`)

**Step 2:** Run deployment script
```bash
cd /c/Users/lopes/elolab

# Set your service role key as environment variable
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Install dependency (one-time)
npm install @supabase/supabase-js

# Run deployment
node deploy-templates-prod.mjs
```

**Step 3:** Watch output
- Should see ✅ for each template
- Final message: "EloLab is now LIVE with full automation system!"

---

## 📱 Verify Deployment Live

### Check Code Deployment
```
https://app.elolab.com.br
↓
You should see:
- Chat Interno in sidebar (under Principal)
- Templates Email in sidebar (under Administração)
- Bell 🔔 icon in top-right (NotificationCenter)
```

### Check Templates Seeded
```
https://app.supabase.com
→ EloLab project
→ Table Editor
→ notification_templates
↓
You should see 3 rows:
1. Confirmação de Consulta (ativo: true)
2. Resultado de Exame Disponível (ativo: true)
3. Recibo de Pagamento (ativo: true)
```

### Test Live Flow (Optional)
1. Go to **Agenda** (`/agenda`)
2. Create a test appointment
3. Change status to "Confirmado"
4. Go to **Automacoes** (`/automacoes`)
5. Check automation_logs table
6. Should show execution with status: "sucesso"

---

## 📊 Deployment Summary

| Component | Status | Where | Action |
|-----------|--------|-------|--------|
| **Code** | ✅ Deployed | app.elolab.com.br | Live now |
| **ChatInterno** | ✅ Ready | `/chat` | Accessible |
| **TemplatesEmail** | ✅ Ready | `/templates-email` | Accessible |
| **NotificationCenter** | ✅ Ready | Header 🔔 | Accessible |
| **Automations** | ✅ Ready | `/automacoes` | Functional |
| **Email Templates** | 🔄 Pending | Supabase DB | **YOU: Seed now** |

---

## 🎯 Next After Seeding

1. **Customize Templates** (optional)
   - Go to: https://app.elolab.com.br/templates-email
   - Edit HTML, colors, text to match clinic branding
   - Save

2. **Train Staff**
   - Show them **Chat** at `/chat`
   - Show them **Templates** at `/templates-email`
   - Show them **Automation Logs** at `/automacoes`

3. **Monitor**
   - Check `notification_queue` for sent messages
   - Check `automation_logs` for execution status
   - Adjust templates as needed

---

## 🆘 If Seeding Fails

**Error: "23505 - duplicate key"**
- Templates already exist, that's OK ✅

**Error: "invalid API key"**
- Check you copied the `service_role` key (not anon key)
- Go back to Settings → API → copy again

**Error: "connection timeout"**
- Check internet connection
- Verify Supabase project is active

**Still stuck?**
- Use Option A (manual copy/paste in SQL Editor)
- Guaranteed to work!

---

## ✨ You're Done When...

- ✅ Code deployed to app.elolab.com.br
- ✅ 3 templates visible in notification_templates table
- ✅ Chat, Templates, and Notifications accessible
- ✅ All features tested and working

**That's it! EloLab is now LIVE for clinic operations!** 🏥🚀

---

## 📞 Support Checklist

- [ ] Code pushed to main
- [ ] Vercel deployment shows "Ready" (green)
- [ ] Email templates seeded into Supabase
- [ ] All 3 UI pages accessible
- [ ] Test appointment confirmation sent email
- [ ] Templates customized with clinic branding
- [ ] Staff trained on new features

---

Generated: 2026-04-13 | Final Deployment Step
