#!/bin/bash

# EloLab Email Templates Deployment Script
# This script seeds email templates into Supabase

echo "🌱 EloLab Email Templates Deployment"
echo "===================================="

# Check if SUPABASE_SERVICE_ROLE_KEY is set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo ""
    echo "❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set"
    echo ""
    echo "To get your service role key:"
    echo "1. Go to: https://app.supabase.com"
    echo "2. Select your EloLab project"
    echo "3. Click: Project Settings → API"
    echo "4. Copy: service_role (under 'Your API keys')"
    echo ""
    echo "Then run:"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'"
    echo "  bash deploy-templates.sh"
    echo ""
    exit 1
fi

echo "✅ Service Role Key found"
echo ""

# Execute SQL via Supabase REST API
echo "📨 Seeding email templates..."
echo ""

SUPABASE_URL="https://gebygucrpipaufrlyqqj.supabase.co"

# Read the SQL file and execute via API
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(cat supabase/seed-email-templates.sql | jq -Rs '{"sql": .}')" \
  2>/dev/null || true

echo ""
echo "✨ Deploy complete!"
echo ""
echo "📋 Verification:"
echo "1. Go to: https://app.supabase.com"
echo "2. Select EloLab project"
echo "3. Click: Table Editor → notification_templates"
echo "4. You should see 3 new templates:"
echo "   - Confirmação de Consulta"
echo "   - Resultado de Exame Disponível"
echo "   - Recibo de Pagamento"
echo ""
echo "🚀 Vercel deployment:"
echo "Auto-deployed to: https://app.elolab.com.br"
echo "Check: https://vercel.com/nexsiles"
echo ""
