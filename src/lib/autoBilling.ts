/**
 * Auto-billing utility: creates a lancamento (billing entry) when
 * an appointment is finalized, with price lookup from tipos_consulta
 * and convenio-specific pricing.
 */
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AutoBillingParams {
  agendamentoId: string;
  pacienteId: string;
  pacienteNome: string;
  convenioId?: string | null;
  tipoConsulta?: string | null;
  data?: string; // YYYY-MM-DD, defaults to today
}

export async function createAutoBilling(params: AutoBillingParams): Promise<boolean> {
  const {
    agendamentoId,
    pacienteId,
    pacienteNome,
    convenioId,
    tipoConsulta,
    data = format(new Date(), 'yyyy-MM-dd'),
  } = params;

  // Check if lancamento already exists for this agendamento
  const { data: existing } = await supabase
    .from('lancamentos')
    .select('id')
    .eq('agendamento_id', agendamentoId)
    .limit(1);

  if (existing && existing.length > 0) return false; // Already billed

  let valor = 0;
  let descricao = 'Consulta';

  // Try to find price from tipos_consulta
  if (tipoConsulta) {
    const { data: tc } = await supabase
      .from('tipos_consulta')
      .select('id, nome, valor_particular')
      .eq('nome', tipoConsulta)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle();

    if (tc) {
      valor = tc.valor_particular || 0;
      descricao = tc.nome;

      // Check for convenio-specific price
      if (convenioId && tc.id) {
        const { data: precoConv } = await supabase
          .from('precos_consulta_convenio')
          .select('valor')
          .eq('convenio_id', convenioId)
          .eq('tipo_consulta_id', tc.id)
          .eq('ativo', true)
          .maybeSingle();
        if (precoConv) valor = precoConv.valor;
      }
    }
  }

  // Fallback: use convenio default value
  if (valor === 0 && convenioId) {
    const { data: conv } = await supabase
      .from('convenios')
      .select('valor_consulta')
      .eq('id', convenioId)
      .maybeSingle();
    if (conv?.valor_consulta) valor = conv.valor_consulta;
  }

  const { error } = await supabase.from('lancamentos').insert({
    tipo: 'receita',
    categoria: 'consulta',
    descricao: `${descricao} — ${pacienteNome}`,
    valor,
    data,
    data_vencimento: data,
    status: 'pendente',
    paciente_id: pacienteId,
    agendamento_id: agendamentoId,
    forma_pagamento: null,
  });

  return !error;
}
