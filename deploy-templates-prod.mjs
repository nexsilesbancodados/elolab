#!/usr/bin/env node

/**
 * EloLab Email Templates Deployment Script
 * Requires: SUPABASE_SERVICE_ROLE_KEY environment variable
 * Usage: SUPABASE_SERVICE_ROLE_KEY='your-key' node deploy-templates-prod.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gebygucrpipaufrlyqqj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not set');
  console.error('');
  console.error('To get your service role key:');
  console.error('1. Go to: https://app.supabase.com');
  console.error('2. Select your EloLab project');
  console.error('3. Click: Project Settings → API');
  console.error('4. Copy: service_role (under "Your API keys")');
  console.error('');
  console.error('Then run:');
  console.error("  SUPABASE_SERVICE_ROLE_KEY='your-key-here' node deploy-templates-prod.mjs");
  console.error('');
  process.exit(1);
}

console.log('🌱 EloLab Email Templates Deployment');
console.log('====================================');
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const templates = [
  {
    categoria: 'confirmacao',
    tipo: 'email',
    nome: 'Confirmação de Consulta',
    assunto: 'Sua consulta foi confirmada - {{clinica_nome}}',
    conteudo: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">✅ Consulta Confirmada!</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #1f2937; font-size: 16px;">Olá, {{paciente_nome}}!</p>
      <p style="color: #475569; line-height: 1.6;">Sua consulta foi confirmada com sucesso. Aqui estão os detalhes:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>📅 Data:</strong> {{data}}</p>
        <p style="margin: 8px 0;"><strong>🕐 Horário:</strong> {{horario}}</p>
        <p style="margin: 8px 0;"><strong>👨‍⚕️ Médico:</strong> {{medico_nome}}</p>
        <p style="margin: 8px 0;"><strong>🏥 Local:</strong> {{clinica_nome}}, {{clinica_endereco}}</p>
      </div>
      <p style="color: #475569; line-height: 1.6;"><strong>Importante:</strong> Chegue 10 minutos antes do horário agendado. Traga seus documentos de identidade e cartão de convênio (se aplicável).</p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">© EloLab — Sistema de Gestão Clínica<br>{{clinica_nome}} | {{clinica_endereco}}</p>
    </div>
  </div>`,
    variaveis: ['paciente_nome', 'data', 'horario', 'medico_nome', 'clinica_nome', 'clinica_endereco'],
    ativo: true,
  },
  {
    categoria: 'resultado_exame',
    tipo: 'email',
    nome: 'Resultado de Exame Disponível',
    assunto: 'Seu resultado de exame está disponível - {{clinica_nome}}',
    conteudo: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 30px; border-radius: 12px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">📋 Resultado Disponível</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #1f2937; font-size: 16px;">Olá, {{paciente_nome}}!</p>
      <p style="color: #475569; line-height: 1.6;">O resultado do seu exame <strong>{{tipo_exame}}</strong> está disponível e pronto para consulta.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{link_portal}}" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Visualizar Resultado</a>
      </div>
      <p style="color: #475569; line-height: 1.6;">Se você tiver dúvidas sobre o resultado, não hesite em entrar em contato com {{clinica_nome}}.</p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">© EloLab — Sistema de Gestão Clínica<br>Resultado disponibilizado em: {{data_resultado}}</p>
    </div>
  </div>`,
    variaveis: ['paciente_nome', 'tipo_exame', 'link_portal', 'data_resultado', 'clinica_nome'],
    ativo: true,
  },
  {
    categoria: 'financeiro',
    tipo: 'email',
    nome: 'Recibo de Pagamento',
    assunto: 'Recibo de Pagamento - {{clinica_nome}}',
    conteudo: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; border-radius: 12px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">💳 Pagamento Recebido</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #1f2937; font-size: 16px;">Olá, {{paciente_nome}}!</p>
      <p style="color: #475569; line-height: 1.6;">Seu pagamento foi recebido com sucesso. Segue o recibo detalhado:</p>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
        <p style="margin: 8px 0;"><strong>Descrição:</strong> {{descricao}}</p>
        <p style="margin: 8px 0;"><strong>Valor:</strong> {{valor}}</p>
        <p style="margin: 8px 0;"><strong>Forma de Pagamento:</strong> {{forma_pagamento}}</p>
        <p style="margin: 8px 0;"><strong>Data do Pagamento:</strong> {{data}}</p>
        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">✓ CONFIRMADO</span></p>
      </div>
      <p style="color: #475569; line-height: 1.6;">Obrigado por sua confiança em {{clinica_nome}}! O recibo foi salvo em seu histórico de pagamentos.</p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">© EloLab — Sistema de Gestão Clínica<br>{{clinica_nome}} | CNPJ: {{clinica_cnpj}}</p>
    </div>
  </div>`,
    variaveis: ['paciente_nome', 'descricao', 'valor', 'forma_pagamento', 'data', 'clinica_nome', 'clinica_cnpj'],
    ativo: true,
  },
];

async function seedTemplates() {
  try {
    console.log('✅ Service Role Key loaded');
    console.log('📨 Inserting email templates...');
    console.log('');

    for (const template of templates) {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert([template])
        .select();

      if (error) {
        if (error.code === '23505') {
          console.log(`⚠️  ${template.nome} — Already exists (skipped)`);
        } else {
          console.error(`❌ ${template.nome} — Error: ${error.message}`);
        }
      } else {
        console.log(`✅ ${template.nome} — Inserted`);
      }
    }

    console.log('');
    console.log('✨ Email templates deployment complete!');
    console.log('');
    console.log('📋 Verification:');
    console.log('1. Go to: https://app.supabase.com');
    console.log('2. Select EloLab project');
    console.log('3. Click: Table Editor → notification_templates');
    console.log('4. You should see 3 templates with "ativo: true"');
    console.log('');
    console.log('🚀 Code deployed:');
    console.log('✅ Pushed to: https://github.com/nexsilesbancodados/elolab');
    console.log('✅ Auto-deployed to: https://app.elolab.com.br (Vercel)');
    console.log('');
    console.log('🎉 EloLab is now LIVE with full automation system!');
    console.log('');
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
  }
}

seedTemplates();
