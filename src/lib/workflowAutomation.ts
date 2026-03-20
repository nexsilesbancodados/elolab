/**
 * Centralized Workflow Automation Engine
 * Handles automated transitions across all clinical flows:
 * - Agendamento → Fila → Atendimento → Billing → Pagamento
 * - Exame → Coleta → Análise → Laudo → Billing
 * - Triagem → Fila (with priority mapping)
 * - Prescrição → Dispensação (stock deduction)
 * - Atendimento finalizado → Retorno agendado
 * - Notificações automáticas em pontos-chave
 */
import { supabase } from '@/integrations/supabase/client';
import { createAutoBilling } from '@/lib/autoBilling';
import { format } from 'date-fns';

// ─── Types ──────────────────────────────────────────────
interface WorkflowResult {
  success: boolean;
  message: string;
  actions: string[]; // list of automated actions taken
}

// ─── 1. Check-in Automático ─────────────────────────────
/** When a patient arrives, auto check-in and add to queue */
export async function autoCheckin(agendamentoId: string): Promise<WorkflowResult> {
  const actions: string[] = [];

  try {
    // Check if already in queue
    const { data: existing } = await supabase
      .from('fila_atendimento')
      .select('id')
      .eq('agendamento_id', agendamentoId)
      .neq('status', 'finalizado')
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true, message: 'Paciente já está na fila', actions: [] };
    }

    // Update agendamento status
    await supabase.from('agendamentos').update({ status: 'aguardando' }).eq('id', agendamentoId);
    actions.push('Status do agendamento → Aguardando');

    // Get next position
    const { data: lastFila } = await supabase
      .from('fila_atendimento')
      .select('posicao')
      .order('posicao', { ascending: false })
      .limit(1);
    const nextPos = (lastFila?.[0]?.posicao || 0) + 1;

    // Add to queue
    await supabase.from('fila_atendimento').insert({
      agendamento_id: agendamentoId,
      posicao: nextPos,
      status: 'aguardando',
      prioridade: 'normal',
      horario_chegada: new Date().toISOString(),
    });
    actions.push('Paciente adicionado à fila');

    return { success: true, message: 'Check-in automático realizado', actions };
  } catch (e: any) {
    return { success: false, message: e.message, actions };
  }
}

// ─── 2. Iniciar Atendimento ─────────────────────────────
/** Start consultation: update statuses + auto-create prontuário */
export async function autoIniciarAtendimento(
  agendamentoId: string,
  filaId: string,
  pacienteId: string,
  medicoId: string,
): Promise<WorkflowResult> {
  const actions: string[] = [];

  try {
    // Update statuses
    await supabase.from('agendamentos').update({ status: 'em_atendimento' }).eq('id', agendamentoId);
    await supabase.from('fila_atendimento').update({ status: 'em_atendimento' }).eq('id', filaId);
    actions.push('Status → Em Atendimento');

    // Auto-create prontuário if none exists for today
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: existingPront } = await supabase
      .from('prontuarios')
      .select('id')
      .eq('paciente_id', pacienteId)
      .eq('agendamento_id', agendamentoId)
      .limit(1);

    if (!existingPront || existingPront.length === 0) {
      await supabase.from('prontuarios').insert({
        paciente_id: pacienteId,
        medico_id: medicoId,
        agendamento_id: agendamentoId,
        data_consulta: today,
        queixa_principal: '',
        evolucao: '',
      });
      actions.push('Prontuário criado automaticamente');
    }

    return { success: true, message: 'Atendimento iniciado', actions };
  } catch (e: any) {
    return { success: false, message: e.message, actions };
  }
}

// ─── 3. Finalizar Atendimento (completo) ────────────────
/** Finalize: billing + auto-schedule return if applicable */
export async function autoFinalizarAtendimento(params: {
  agendamentoId: string;
  filaId?: string;
  pacienteId: string;
  pacienteNome: string;
  medicoId: string;
  convenioId?: string | null;
  tipoConsulta?: string | null;
  agendarRetorno?: boolean;
  diasRetorno?: number;
}): Promise<WorkflowResult> {
  const actions: string[] = [];

  try {
    // Update statuses
    await supabase.from('agendamentos').update({ status: 'finalizado' }).eq('id', params.agendamentoId);
    actions.push('Agendamento → Finalizado');

    if (params.filaId) {
      await supabase.from('fila_atendimento').update({ status: 'finalizado' }).eq('id', params.filaId);
      actions.push('Fila → Finalizado');
    }

    // Auto-billing
    const billed = await createAutoBilling({
      agendamentoId: params.agendamentoId,
      pacienteId: params.pacienteId,
      pacienteNome: params.pacienteNome,
      convenioId: params.convenioId,
      tipoConsulta: params.tipoConsulta,
      data: format(new Date(), 'yyyy-MM-dd'),
    });
    if (billed) actions.push('Cobrança gerada automaticamente');

    // Auto-schedule return if requested
    if (params.agendarRetorno && params.diasRetorno) {
      const dataRetorno = new Date();
      dataRetorno.setDate(dataRetorno.getDate() + params.diasRetorno);
      
      await supabase.from('retornos').insert({
        paciente_id: params.pacienteId,
        medico_id: params.medicoId,
        data_prevista: format(dataRetorno, 'yyyy-MM-dd'),
        motivo: `Retorno de ${params.tipoConsulta || 'consulta'}`,
        status: 'pendente',
        agendamento_origem_id: params.agendamentoId,
      });
      actions.push(`Retorno agendado para ${format(dataRetorno, 'dd/MM/yyyy')}`);
    }

    // Auto-queue notification
    const pac = await supabase
      .from('pacientes')
      .select('email, telefone')
      .eq('id', params.pacienteId)
      .maybeSingle();

    if (pac.data?.email) {
      await supabase.from('notification_queue').insert({
        tipo: 'email',
        destinatario_id: params.pacienteId,
        destinatario_email: pac.data.email,
        destinatario_nome: params.pacienteNome,
        assunto: 'Consulta finalizada — Resumo do atendimento',
        conteudo: `Olá ${params.pacienteNome}, seu atendimento foi concluído. Caso tenha receitas ou exames, eles já estão disponíveis no seu portal.`,
        status: 'pendente',
      });
      actions.push('Notificação de conclusão enviada');
    }

    return { success: true, message: 'Atendimento finalizado com sucesso', actions };
  } catch (e: any) {
    return { success: false, message: e.message, actions };
  }
}

// ─── 4. Auto Coleta (Exames de Laboratório) ─────────────
/** When a lab exam is created, auto-create coleta record */
export async function autoCreateColeta(params: {
  exameId: string;
  pacienteId: string;
  medicoId: string;
  tipoExame: string;
  urgente?: boolean;
}): Promise<WorkflowResult> {
  const actions: string[] = [];

  try {
    // Determine if this is a lab exam (blood, urine, etc.)
    const labKeywords = [
      'hemograma', 'glicemia', 'colesterol', 'trigliceri', 'ureia', 'creatinina',
      'tgo', 'tgp', 'gama', 'bilirrubina', 'tsh', 'pcr', 'vdrl', 'hiv',
      'hepatite', 'eas', 'urina', 'urocultura', 'hemocultura', 'cultura',
      'ferro', 'ferritina', 'vitamina', 'hormonio', 'cortisol', 'insulina',
      'psa', 'cea', 'hemoglobina', 'vhs', 'coagulograma', 'gasometria',
      'anti-', 'fator', 'complemento', 'ige', 'parasitol', 'sangue oculto',
      'calprotectina', 'coprocultura', 'baar', 'd-dimero', 'fibrinogenio',
      'tap', 'ttpa', 'inr', 'reticulocito', 'tipagem', 'eletroforese',
    ];

    const tipoLower = params.tipoExame.toLowerCase();
    const isLab = labKeywords.some(kw => tipoLower.includes(kw));

    if (!isLab) {
      return { success: true, message: 'Exame de imagem — coleta não necessária', actions: ['Exame identificado como não-laboratorial'] };
    }

    // Determine sample type
    let tipoAmostra = 'sangue';
    let tubo = 'EDTA (roxo)';
    if (tipoLower.includes('urina') || tipoLower.includes('eas') || tipoLower.includes('urocultura') || tipoLower.includes('clearance')) {
      tipoAmostra = 'urina';
      tubo = 'Frasco estéril';
    } else if (tipoLower.includes('fezes') || tipoLower.includes('parasitol') || tipoLower.includes('coprocultura') || tipoLower.includes('calprotectina') || tipoLower.includes('sangue oculto')) {
      tipoAmostra = 'fezes';
      tubo = 'Coletor de fezes';
    } else if (tipoLower.includes('coagulograma') || tipoLower.includes('tap') || tipoLower.includes('ttpa') || tipoLower.includes('inr') || tipoLower.includes('fibrinogenio') || tipoLower.includes('d-dimero')) {
      tubo = 'Citrato (azul)';
    } else if (tipoLower.includes('glicemia') || tipoLower.includes('lactato')) {
      tubo = 'Fluoreto (cinza)';
    } else if (tipoLower.includes('vhs')) {
      tubo = 'Citrato (preto)';
    }

    // Check jejum
    const jejumExames = ['glicemia', 'colesterol', 'trigliceri', 'perfil lipidico', 'curva glice', 'insulina'];
    const jejumNecessario = jejumExames.some(kw => tipoLower.includes(kw));

    // Check if coleta already exists
    const { data: existingColeta } = await supabase
      .from('coletas_laboratorio')
      .select('id')
      .eq('exame_id', params.exameId)
      .limit(1);

    if (existingColeta && existingColeta.length > 0) {
      return { success: true, message: 'Coleta já registrada', actions: [] };
    }

    await supabase.from('coletas_laboratorio').insert({
      exame_id: params.exameId,
      paciente_id: params.pacienteId,
      medico_solicitante_id: params.medicoId,
      tipo_amostra: tipoAmostra,
      tubo,
      status: 'pendente',
      urgente: params.urgente || false,
      jejum_necessario: jejumNecessario,
      jejum_horas: jejumNecessario ? 8 : null,
    });
    actions.push(`Coleta de ${tipoAmostra} criada (tubo: ${tubo})`);

    if (jejumNecessario) {
      actions.push('Jejum de 8h necessário — paciente será orientado');
    }

    if (params.urgente) {
      actions.push('⚡ Marcada como URGENTE');
    }

    return { success: true, message: 'Coleta criada automaticamente', actions };
  } catch (e: any) {
    return { success: false, message: e.message, actions };
  }
}

// ─── 5. Auto Dispensação (Prescrição → Estoque) ─────────
/** Dispense medications and deduct from stock */
export async function autoDispensarMedicamentos(params: {
  medicamentos: Array<{ nome: string; quantidade: string }>;
  pacienteId: string;
  pacienteNome: string;
  userId?: string;
}): Promise<WorkflowResult> {
  const actions: string[] = [];
  const alertas: string[] = [];

  try {
    for (const med of params.medicamentos) {
      if (!med.nome || !med.quantidade) continue;
      const qty = parseInt(med.quantidade) || 1;

      // Find in stock by name match
      const { data: stockItem } = await supabase
        .from('estoque')
        .select('id, quantidade, nome, quantidade_minima')
        .ilike('nome', `%${med.nome.split(' ')[0]}%`)
        .gt('quantidade', 0)
        .order('validade', { ascending: true }) // Use closest to expiry first (FEFO)
        .limit(1)
        .maybeSingle();

      if (!stockItem) {
        alertas.push(`${med.nome}: não encontrado no estoque`);
        continue;
      }

      if (stockItem.quantidade < qty) {
        alertas.push(`${stockItem.nome}: estoque insuficiente (${stockItem.quantidade} disponível, ${qty} solicitado)`);
        continue;
      }

      // Deduct
      await supabase.from('estoque').update({
        quantidade: stockItem.quantidade - qty,
      }).eq('id', stockItem.id);

      // Log movement
      await supabase.from('movimentacoes_estoque').insert({
        item_id: stockItem.id,
        tipo: 'saida',
        quantidade: qty,
        motivo: `Dispensação — ${params.pacienteNome}`,
        usuario_id: params.userId || null,
      });

      actions.push(`${stockItem.nome}: -${qty} unidade(s)`);

      // Alert if below minimum
      const newQty = stockItem.quantidade - qty;
      if (newQty <= (stockItem.quantidade_minima || 0)) {
        alertas.push(`⚠️ ${stockItem.nome}: estoque crítico (${newQty} restantes)`);
      }
    }

    const message = alertas.length > 0
      ? `Dispensação parcial: ${actions.length} item(s) dispensado(s), ${alertas.length} alerta(s)`
      : `${actions.length} medicamento(s) dispensado(s) com sucesso`;

    return { success: true, message, actions: [...actions, ...alertas] };
  } catch (e: any) {
    return { success: false, message: e.message, actions };
  }
}

// ─── 6. Auto Notificação Retorno ────────────────────────
/** Check and notify patients about upcoming returns */
export async function autoNotificarRetornos(): Promise<WorkflowResult> {
  const actions: string[] = [];
  try {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = format(amanha, 'yyyy-MM-dd');

    const { data: retornos } = await supabase
      .from('retornos')
      .select('*, pacientes(nome, email, telefone)')
      .eq('data_prevista', amanhaStr)
      .eq('status', 'pendente');

    if (!retornos || retornos.length === 0) {
      return { success: true, message: 'Sem retornos para amanhã', actions: [] };
    }

    for (const ret of retornos as any[]) {
      if (ret.pacientes?.email) {
        await supabase.from('notification_queue').insert({
          tipo: 'email',
          destinatario_id: ret.paciente_id,
          destinatario_email: ret.pacientes.email,
          destinatario_nome: ret.pacientes.nome,
          assunto: 'Lembrete de Retorno — Amanhã',
          conteudo: `Olá ${ret.pacientes.nome}, lembramos que seu retorno está agendado para amanhã. Entre em contato para confirmar.`,
          status: 'pendente',
        });
        actions.push(`Notificação enviada: ${ret.pacientes.nome}`);
      }
    }

    return { success: true, message: `${actions.length} notificação(ões) de retorno enviada(s)`, actions };
  } catch (e: any) {
    return { success: false, message: e.message, actions };
  }
}

// ─── 7. Auto Billing Exame ──────────────────────────────
/** Generate billing when exam report is released */
export async function autoBillingExame(params: {
  exameId: string;
  pacienteId: string;
  pacienteNome: string;
  tipoExame: string;
  convenioId?: string | null;
}): Promise<WorkflowResult> {
  const actions: string[] = [];

  try {
    // Check if already billed
    const { data: existing } = await supabase
      .from('lancamentos')
      .select('id')
      .eq('categoria', 'exame')
      .ilike('descricao', `%${params.exameId.slice(0, 8)}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true, message: 'Exame já faturado', actions: [] };
    }

    let valor = 0;

    // Lookup price from convenio table
    if (params.convenioId) {
      const exameName = params.tipoExame.split(' - ').pop() || params.tipoExame;
      const { data: preco } = await supabase
        .from('precos_exames_convenio')
        .select('valor_total, valor_tabela')
        .eq('convenio_id', params.convenioId)
        .ilike('tipo_exame', `%${exameName}%`)
        .eq('ativo', true)
        .limit(1)
        .maybeSingle();
      if (preco) valor = preco.valor_total || preco.valor_tabela;
    }

    await supabase.from('lancamentos').insert({
      tipo: 'receita',
      categoria: 'exame',
      descricao: `Exame: ${params.tipoExame} — ${params.pacienteNome} [${params.exameId.slice(0, 8)}]`,
      valor,
      data: format(new Date(), 'yyyy-MM-dd'),
      data_vencimento: format(new Date(), 'yyyy-MM-dd'),
      status: 'pendente',
      paciente_id: params.pacienteId,
    });
    actions.push(`Cobrança de R$ ${valor.toFixed(2)} gerada`);

    // Notify patient about result availability
    const { data: pac } = await supabase
      .from('pacientes')
      .select('email')
      .eq('id', params.pacienteId)
      .maybeSingle();

    if (pac?.email) {
      await supabase.from('notification_queue').insert({
        tipo: 'email',
        destinatario_id: params.pacienteId,
        destinatario_email: pac.email,
        destinatario_nome: params.pacienteNome,
        assunto: `Resultado de exame disponível — ${params.tipoExame}`,
        conteudo: `Olá ${params.pacienteNome}, o resultado do seu exame "${params.tipoExame}" já está disponível. Acesse pelo portal do paciente ou retire na clínica.`,
        status: 'pendente',
      });
      actions.push('Notificação de resultado enviada ao paciente');
    }

    return { success: true, message: 'Faturamento de exame concluído', actions };
  } catch (e: any) {
    return { success: false, message: e.message, actions };
  }
}

// ─── 8. Fluxo Completo de Triagem → Fila ───────────────
/** Save triage and auto-add to queue with Manchester priority */
export async function autoTriagemParaFila(params: {
  agendamentoId: string;
  classificacaoRisco: 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul';
}): Promise<WorkflowResult> {
  const actions: string[] = [];

  try {
    const prioridadeMap: Record<string, string> = {
      vermelho: 'urgente', laranja: 'urgente', amarelo: 'preferencial',
      verde: 'normal', azul: 'normal',
    };

    // Check if already in queue
    const { data: existing } = await supabase
      .from('fila_atendimento')
      .select('id, prioridade')
      .eq('agendamento_id', params.agendamentoId)
      .neq('status', 'finalizado')
      .limit(1);

    const novaPrioridade = prioridadeMap[params.classificacaoRisco];

    if (existing && existing.length > 0) {
      // Update priority if already in queue
      if (existing[0].prioridade !== novaPrioridade) {
        await supabase.from('fila_atendimento')
          .update({ prioridade: novaPrioridade })
          .eq('id', existing[0].id);
        actions.push(`Prioridade atualizada para ${novaPrioridade}`);
      }
      return { success: true, message: 'Prioridade atualizada na fila', actions };
    }

    // Add to queue
    const { data: lastFila } = await supabase
      .from('fila_atendimento')
      .select('posicao')
      .order('posicao', { ascending: false })
      .limit(1);
    const nextPos = (lastFila?.[0]?.posicao || 0) + 1;

    // Urgent patients go to front
    const isUrgent = params.classificacaoRisco === 'vermelho' || params.classificacaoRisco === 'laranja';
    const posicao = isUrgent ? 0 : nextPos;

    await supabase.from('fila_atendimento').insert({
      agendamento_id: params.agendamentoId,
      posicao,
      status: 'aguardando',
      prioridade: novaPrioridade,
      horario_chegada: new Date().toISOString(),
    });
    actions.push(`Adicionado à fila (prioridade: ${novaPrioridade})`);

    await supabase.from('agendamentos').update({ status: 'aguardando' }).eq('id', params.agendamentoId);
    actions.push('Agendamento → Aguardando');

    if (isUrgent) {
      actions.push('⚡ Paciente posicionado no início da fila');
    }

    return { success: true, message: 'Paciente adicionado à fila com prioridade', actions };
  } catch (e: any) {
    return { success: false, message: e.message, actions };
  }
}

// ─── 9. Confirmar Pagamento Completo ────────────────────
/** Confirm payment and auto-close the flow */
export async function autoConfirmarPagamento(params: {
  lancamentoId: string;
  formaPagamento: string;
  desconto?: number;
  acrescimo?: number;
  observacoes?: string;
}): Promise<WorkflowResult> {
  const actions: string[] = [];

  try {
    await supabase.from('lancamentos').update({
      status: 'pago',
      forma_pagamento: params.formaPagamento,
      observacoes: params.observacoes || null,
    }).eq('id', params.lancamentoId);
    actions.push('Pagamento confirmado');

    // Get lancamento details for MercadoPago record
    const { data: lanc } = await supabase
      .from('lancamentos')
      .select('valor, paciente_id, agendamento_id, descricao')
      .eq('id', params.lancamentoId)
      .maybeSingle();

    if (lanc) {
      const valorFinal = lanc.valor - (params.desconto || 0) + (params.acrescimo || 0);

      // Create payment record
      await supabase.from('pagamentos_mercadopago').insert({
        valor: valorFinal,
        valor_pago: valorFinal,
        status: 'aprovado',
        tipo: 'consulta',
        metodo_pagamento: params.formaPagamento,
        paciente_id: lanc.paciente_id,
        agendamento_id: lanc.agendamento_id,
        lancamento_id: params.lancamentoId,
        descricao: lanc.descricao,
        data_aprovacao: new Date().toISOString(),
        desconto: params.desconto || 0,
        acrescimo: params.acrescimo || 0,
      });
      actions.push(`Registro de pagamento: R$ ${valorFinal.toFixed(2)}`);
    }

    return { success: true, message: 'Pagamento processado com sucesso', actions };
  } catch (e: any) {
    return { success: false, message: e.message, actions };
  }
}
