# EloLab Payment and Trial Flows Documentation

## Overview
This document describes the complete payment and trial subscription flows in EloLab, covering both free trials with payment method and direct subscription purchases via Mercado Pago.

## Architecture

### Key Components
- **Frontend:** React pages (Planos.tsx, PortalPaciente.tsx)
- **Edge Functions:** trial-with-payment, mercadopago-checkout, mercadopago-webhook
- **Database:** assinaturas_plano table with detailed JSON metadata
- **Payment Gateway:** Mercado Pago API (preapproval for subscriptions, preferences for one-time)

---

## Flow 1: Free Trial with Payment Method (3-Day Auto-Charge)

### User Journey
```
1. User clicks "Testar Grátis" button on Planos page
2. PaymentMethodDialog opens → user selects payment method
3. Frontend calls trial-with-payment edge function
4. Edge function creates Mercado Pago preapproval
5. Trial record created in DB with 3-day expiration
6. User gains immediate access to plan
7. Auto-charge occurs 3 days later
```

### Frontend Flow (Planos.tsx)

```typescript
// Step 1: User selects plan → opens PaymentMethodDialog
<Button onClick={() => {
  setSelectedPlan(plano);
  setShowPaymentDialog(true);
}}>Testar Grátis</Button>

// Step 2: Dialog collects payment method (credit_card or pix_recurring)
<PaymentMethodDialog
  open={showPaymentDialog}
  onSubmit={handleStartTrialWithPayment}
/>

// Step 3: Handler calls useStartTrialWithPayment mutation
const handleStartTrialWithPayment = (paymentData: PaymentMethodData) => {
  startTrialWithPayment.mutate({
    plano_slug: selectedPlan.slug,
    plano_nome: selectedPlan.nome,
    plano_valor: selectedPlan.valor,
    trial_dias: selectedPlan.trial_dias || 3,
    payment_method: paymentData.method,
    payer_email: user.email,
    payer_name: profile?.nome || user.email,
  });
};
```

### Edge Function Flow (trial-with-payment/index.ts)

```typescript
// Step 1: Validate inputs
- Check payment_method is credit_card or pix_recurring
- Verify trial_dias between 1-30 days
- Validate email format
- Ensure user doesn't already have active trial/subscription

// Step 2: Create Mercado Pago preapproval
const preapprovalPayload = {
  payer_email: payer_email,
  reason: `${plano_nome} - Período de Teste (${trial_dias} dias)`,
  auto_recurring: {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: plano_valor,  // Will charge AFTER trial
    start_date: chargeDate.toISOString(),  // 3 days from now
    end_date: new Date(+1 year).toISOString(),
  },
  notification_url: webhookUrl,
};

// Step 3: Save trial record with metadata
const trialRecord = await supabase.from("assinaturas_plano").insert({
  user_id: user.id,
  plano_slug: plano_slug,
  status: "trial",
  em_trial: true,
  trial_fim: trialEndDate.toISOString(),  // Now + 3 days
  detalhes: {
    trial_type: "with_payment_method",
    preapproval_id: response.id,
    payment_method: payment_method,
    charge_date: chargeDate.toISOString(),
  },
});

// Step 4: Return success with trial end date
return {
  success: true,
  trial_id: trialRecord.id,
  trial_end: trialEndDate.toISOString(),
  charge_date: chargeDate.toISOString(),
  message: "Período de teste iniciado. Cobrança em 2026-04-16.",
};
```

### Database State During Trial

```sql
-- assinaturas_plano record
{
  user_id: "uuid...",
  plano_slug: "elolab-max",
  status: "trial",              -- User has access
  em_trial: true,               -- Flags as trial period
  trial_fim: "2026-04-16T...",  -- Expiration (now + 3 days)
  detalhes: {
    trial_type: "with_payment_method",
    preapproval_id: "12345...",
    preapproval_status: "pending",
    payment_method: "credit_card" or "pix_recurring",
    trial_start: "2026-04-13T...",
    trial_end: "2026-04-16T...",
    charge_date: "2026-04-16T...",
    auto_recurring: { frequency: 1, frequency_type: "months", ... }
  }
}
```

### User Access During Trial
- `hasActivePlan` = true (subscription/trial status is 'trial')
- `isTrial` = true (em_trial = true AND status = 'trial')
- User can access all features of the selected plan
- Portal shows countdown: "Restam 2 dias — expira em 16/04/2026 às 15:30"

### Auto-Charge Flow (3 Days Later)

**Trigger:** Mercado Pago auto-recurring payment fires on `auto_recurring.start_date`

**Webhook Request → mercadopago-webhook edge function:**
```json
{
  "type": "subscription_preapproval_create_notification",
  "data": {
    "id": "12345...",
    "status": "authorized",
    "external_reference": "uuid..."
  }
}
```

**Webhook Handler Logic:**
```typescript
// Step 1: Load trial record by external_reference
const assinatura = await supabase
  .from("assinaturas_plano")
  .select("*")
  .eq("detalhes->>'external_reference'", externalReference)
  .single();

// Step 2: Check if this is a trial with payment
const trialType = assinatura.detalhes.trial_type; // "with_payment_method"
const isTrialWithPayment = trialType === "with_payment_method" && trialEnd;

// Step 3: Update status based on charge date
if (isTrialWithPayment && isChargeReady(trialEnd)) {
  // Payment succeeded → activate subscription
  await supabase.from("assinaturas_plano").update({
    status: "ativa",      // Activate subscription
    em_trial: false,      // End trial
    ultima_renovacao: now,
    detalhes: {
      ...assinatura.detalhes,
      activated_from_trial: true,
      preapproval_status: "authorized",
      ultimo_pagamento_autorizado: now,
    }
  });
  
  // Send activation confirmation email
  await supabase.functions.invoke('send-email', {
    template: 'subscription_activated',
    to: user.email,
    data: { plano_nome, charge_amount, next_charge_date }
  });
}
```

### Database State After Auto-Charge

```sql
-- assinaturas_plano record now
{
  user_id: "uuid...",
  plano_slug: "elolab-max",
  status: "ativa",                    -- Now fully active paid subscription
  em_trial: false,                    -- Trial ended
  trial_fim: "2026-04-16T...",       -- Kept for reference
  ultima_renovacao: "2026-04-16T...", -- Payment confirmed
  detalhes: {
    trial_type: "with_payment_method",
    preapproval_id: "12345...",
    preapproval_status: "authorized",  -- Charged successfully
    payment_method: "credit_card",
    charge_date: "2026-04-16T...",
    activated_from_trial: true,
    ultimo_pagamento_autorizado: "2026-04-16T..."
  }
}
```

---

## Flow 2: Direct Subscription Purchase (No Trial)

### User Journey
```
1. User clicks "Assinar Direto" button
2. Edge function creates Mercado Pago checkout preference
3. User redirected to Mercado Pago checkout page
4. User completes payment
5. Mercado Pago redirects back to app
6. Subscription activated via webhook
```

### Frontend Flow (Planos.tsx)

```typescript
const upgradeMutation = useMutation({
  mutationFn: async (plano: any) => {
    const { data } = await supabase.functions.invoke('mercadopago-checkout', {
      body: {
        action: 'create_subscription',
        plano_id: plano.id,
        plano_slug: plano.slug,
        nome_plano: plano.nome,
        valor: plano.valor,
        frequencia: 'mensal',
        payer_email: user.email,
        payer_name: profile?.nome || user.email,
      },
    });
    return data;
  },
  onSuccess: (data: any) => {
    if (data?.checkout_url) {
      // Redirect user to Mercado Pago checkout
      window.location.href = data.checkout_url;
    }
  },
});
```

### Edge Function Flow (mercadopago-checkout/index.ts - create_subscription action)

```typescript
// Step 1: Validate plan exists
const plan = await supabase.from("planos").select("*").eq("id", plano_id).single();

// Step 2: Create checkout preference with fixed amount (no trial)
const preference = {
  items: [
    {
      title: `${nome_plano} - Assinatura Mensal`,
      unit_price: valor,
      quantity: 1,
      currency_id: "BRL",
    }
  ],
  payer: { email: payer_email, name: payer_name },
  back_urls: {
    success: "https://app.elolab.com.br/planos?mp_status=success",
    failure: "https://app.elolab.com.br/planos?mp_status=failure",
    pending: "https://app.elolab.com.br/planos?mp_status=pending",
  },
  notification_url: webhookUrl,
  external_reference: `subscription_${user_id}_${Date.now()}`,
  auto_recurring: {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: valor,
    currency_id: "BRL",
  },
};

// Step 3: Create preference and return checkout URL
const response = await callMercadoPago(`${MP_API_BASE}/checkout/preferences`, "POST", preference);
return { checkout_url: response.init_point };
```

### Webhook Flow (Direct Purchase)

**Webhook → mercadopago-webhook:**
```json
{
  "type": "payment_notification",
  "data": {
    "id": "payment_123...",
    "status": "approved",
    "external_reference": "subscription_user_12345"
  }
}
```

**Handler Logic:**
```typescript
// Extract subscription info from external_reference
const [type, userId, timestamp] = externalReference.split('_');

// Load or create assinatura_plano record
const assinatura = await supabase
  .from("assinaturas_plano")
  .select("*")
  .eq("user_id", userId)
  .eq("status", "ativa")
  .limit(1);

if (!assinatura) {
  // First subscription → create new record
  await supabase.from("assinaturas_plano").insert({
    user_id: userId,
    plano_slug: plano_slug,
    status: "ativa",
    em_trial: false,  // No trial for direct purchases
    ultima_renovacao: now,
    detalhes: {
      payment_type: "direct_purchase",
      payment_id: paymentId,
      external_reference: externalReference,
      payer_email: payer_email,
      first_payment: now,
    }
  });
}
```

---

## Flow 3: Cancel and Reactivate Subscription

### Cancel Subscription

```typescript
// Configuracoes page
const handleCancelSubscription = async () => {
  // Call Mercado Pago to cancel preapproval
  await supabase.functions.invoke('mercadopago-webhook', {
    body: {
      action: 'cancel_subscription',
      preapproval_id: assinatura.detalhes.preapproval_id,
    }
  });

  // Update local record
  await supabase.from("assinaturas_plano").update({
    status: "cancelada",
    data_cancelamento: now,
  }).eq("user_id", user.id);
};
```

### Reactivate (Start New Trial on Same/Different Plan)

User can only activate a new trial if:
- Previous subscription is `cancelada` or `expirada`
- No active trial/subscription for the same plan

Edge function validation prevents duplicate trials.

---

## Error Handling & Edge Cases

### Trial Cancellation During Period
- User cancels before 3-day charge
- Set `status: "cancelada"` in database
- Mercado Pago preapproval is NOT auto-charged
- User loses access to plan features

### Trial Expiration Without Payment
- Charge date arrives but payment fails
- Mercado Pago webhook notifies with failure
- `status: "trial"` → `status: "expirada"`
- User loses access, can start new trial

### Duplicate Trial Prevention
- User tries to start second trial for same plan
- Edge function validates against existing active trials
- Returns 409 Conflict: "Você já possui um plano ativo"

### Plan Upgrade Mid-Subscription
- User on elolab-max, clicks upgrade to elolab-ultra
- Creates new subscription separately
- Previous subscription continues until renewal
- Webhook handles overlap (prefer higher-tier plan)

### Invoice/Receipt Emails
- Trial activation: "Período de teste iniciado"
- After charge: "Cobrança realizada com sucesso"
- Cancellation: "Assinatura cancelada"
- Renewal failure: "Falha ao renovar assinatura"

---

## Testing Checklist

### Trial with Payment Method Flow
- [ ] User can select credit card payment method
- [ ] User can select PIX recurring payment method
- [ ] Trial countdown displays correctly in UI
- [ ] Auto-charge occurs after 3 days
- [ ] User receives email on trial start
- [ ] User receives email after auto-charge

### Direct Purchase Flow
- [ ] Redirect to Mercado Pago checkout works
- [ ] Payment approved → subscription activated
- [ ] User email matches payer email in Mercado Pago
- [ ] Renewal email sends monthly

### Edge Cases
- [ ] Cannot start second trial for same plan
- [ ] Can start trial for different plan
- [ ] Cancel during trial → no charge
- [ ] Cancel after auto-charge → no next renewal
- [ ] Invalid email rejected at edge function
- [ ] Negative price rejected at edge function
- [ ] Invalid trial days (>30) rejected

### Database Integrity
- [ ] assinaturas_plano records created correctly
- [ ] detalhes JSON contains all metadata
- [ ] status transitions follow state machine
- [ ] email/webhook audit trail logged

---

## API Reference

### trial-with-payment
**Endpoint:** `POST /functions/v1/trial-with-payment`

**Request:**
```json
{
  "plano_slug": "elolab-max",
  "plano_nome": "EloLab Max",
  "plano_valor": 299.90,
  "trial_dias": 3,
  "payment_method": "credit_card",
  "payer_email": "user@example.com",
  "payer_name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "preapproval_id": "12345...",
  "trial_id": "uuid...",
  "trial_end": "2026-04-16T15:30:00Z",
  "charge_date": "2026-04-16T15:30:00Z",
  "message": "Período de teste iniciado. Cobrança em 16/04/2026."
}
```

**Errors:**
- 400: Invalid payment method, trial days, price, or email format
- 409: User already has active trial/subscription for this plan
- 401: Unauthorized (invalid token)

---

## Monitoring & Debugging

### Key Metrics
- Trial conversion rate (trials → paid subscriptions)
- Churn rate (cancellations within 30 days)
- Payment success rate (Mercado Pago API health)
- Webhook delivery rate (ensure all events processed)

### Logs to Check
```sql
-- View all trial activations
SELECT user_id, plano_slug, created_at 
FROM assinaturas_plano 
WHERE em_trial = true 
ORDER BY created_at DESC;

-- View auto-charge successes
SELECT user_id, status, detalhes->>'ultimo_pagamento_autorizado' as charged_at
FROM assinaturas_plano
WHERE detalhes->>'trial_type' = 'with_payment_method'
  AND status = 'ativa'
ORDER BY charged_at DESC;

-- View cancellations during trial
SELECT user_id, plano_slug, detalhes->>'trial_end' as trial_ended
FROM assinaturas_plano
WHERE status = 'cancelada'
  AND detalhes->>'trial_type' = 'with_payment_method'
ORDER BY updated_at DESC;
```

### Common Issues

**Issue:** Trial doesn't activate after payment method selection
- **Check:** trial-with-payment edge function logs for validation errors
- **Check:** Mercado Pago access token in environment variables
- **Fix:** Verify payment_method is exactly "credit_card" or "pix_recurring"

**Issue:** Auto-charge doesn't occur after 3 days
- **Check:** Webhook URL is correct in preapproval payload
- **Check:** mercadopago-webhook function is processing events
- **Check:** Mercado Pago notification delivery logs
- **Fix:** Manually trigger webhook test from Mercado Pago dashboard

**Issue:** User can start multiple trials
- **Check:** Validation logic in trial-with-payment edge function
- **Check:** Database constraints on assinaturas_plano
- **Fix:** Query may need to check timestamp of old trials (not just status)

---

## Future Enhancements

1. **Payment Method Management**
   - Allow users to update card/PIX details
   - Support multiple payment methods per account

2. **Prorated Billing**
   - Support mid-month upgrades/downgrades
   - Adjust charges for partial months

3. **Annual Plans**
   - Offer annual subscriptions with discount
   - Adjust auto_recurring frequency_type

4. **Family/Team Accounts**
   - Multi-user subscriptions
   - Split billing across team members

5. **Invoice PDF Generation**
   - Generate and email PDF receipts
   - Track invoice numbers for compliance
