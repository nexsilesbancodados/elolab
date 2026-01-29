import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClinicaInfo {
  nome: string;
  endereco: string;
  telefone: string;
  cnpj: string;
}

const CLINICA: ClinicaInfo = {
  nome: 'EloLab Clínica Médica',
  endereco: 'Av. Principal, 1000 - Centro - São Paulo/SP',
  telefone: '(11) 3000-0000',
  cnpj: '00.000.000/0001-00',
};

// Header padrão para documentos
function addHeader(doc: jsPDF, titulo: string) {
  doc.setFontSize(18);
  doc.setTextColor(0, 102, 204);
  doc.text(CLINICA.nome, 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(CLINICA.endereco, 105, 28, { align: 'center' });
  doc.text(`Tel: ${CLINICA.telefone} | CNPJ: ${CLINICA.cnpj}`, 105, 34, { align: 'center' });

  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(titulo, 105, 50, { align: 'center' });
}

// Footer padrão
function addFooter(doc: jsPDF, pageNum: number = 1) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Página ${pageNum}`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );
}

// Gerar receita médica
export function gerarReceita(
  paciente: { nome: string; cpf?: string; dataNascimento?: string },
  medico: { nome: string; crm?: string; especialidade?: string },
  medicamentos: Array<{
    nome: string;
    dosagem: string;
    via: string;
    frequencia: string;
    duracao: string;
    quantidade: string;
    observacoes?: string;
  }>,
  orientacoes: string,
  tipo: 'simples' | 'controle_especial' | 'antimicrobiano' = 'simples'
) {
  const doc = new jsPDF();

  const tipoLabel = {
    simples: 'RECEITUÁRIO SIMPLES',
    controle_especial: 'RECEITUÁRIO DE CONTROLE ESPECIAL',
    antimicrobiano: 'RECEITUÁRIO DE ANTIMICROBIANOS',
  };

  addHeader(doc, tipoLabel[tipo]);

  // Data e número
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 60);
  doc.text(`Nº: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 170, 60, { align: 'right' });

  // Dados do paciente
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PACIENTE', 20, 75);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome: ${paciente.nome}`, 20, 82);
  if (paciente.cpf) doc.text(`CPF: ${paciente.cpf}`, 120, 82);
  if (paciente.dataNascimento) {
    doc.text(`Data Nasc.: ${format(new Date(paciente.dataNascimento), 'dd/MM/yyyy')}`, 20, 89);
  }

  // Linha separadora
  doc.line(20, 95, 190, 95);

  // Medicamentos
  let yPos = 105;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESCRIÇÃO', 20, yPos);
  yPos += 10;

  medicamentos.forEach((med, index) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${index + 1}. ${med.nome} ${med.dosagem}`, 25, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Via: ${med.via} | ${med.frequencia} | ${med.duracao}`, 30, yPos);
    yPos += 5;
    doc.text(`Quantidade: ${med.quantidade}`, 30, yPos);
    yPos += 5;

    if (med.observacoes) {
      doc.text(`Obs: ${med.observacoes}`, 30, yPos);
      yPos += 5;
    }
    yPos += 5;

    if (yPos > 230) {
      doc.addPage();
      yPos = 30;
    }
  });

  // Orientações
  if (orientacoes) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ORIENTAÇÕES:', 20, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(orientacoes, 160);
    doc.text(lines, 20, yPos);
  }

  // Assinatura do médico
  const assinaturaY = 250;
  doc.line(60, assinaturaY, 150, assinaturaY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(medico.nome, 105, assinaturaY + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`CRM: ${medico.crm || 'N/A'} | ${medico.especialidade || ''}`, 105, assinaturaY + 12, { align: 'center' });

  addFooter(doc);

  return doc;
}

// Gerar atestado médico
export function gerarAtestado(
  paciente: { nome: string; cpf?: string },
  medico: { nome: string; crm?: string; especialidade?: string },
  atestado: {
    tipo: 'comparecimento' | 'afastamento' | 'aptidao' | 'acompanhante';
    dataAtendimento: string;
    diasAfastamento?: number;
    cid?: string;
    observacoes?: string;
  }
) {
  const doc = new jsPDF();

  const tipoTitulo = {
    comparecimento: 'ATESTADO DE COMPARECIMENTO',
    afastamento: 'ATESTADO MÉDICO',
    aptidao: 'ATESTADO DE APTIDÃO FÍSICA',
    acompanhante: 'DECLARAÇÃO DE ACOMPANHANTE',
  };

  addHeader(doc, tipoTitulo[atestado.tipo]);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  let texto = '';
  const dataAtend = format(new Date(atestado.dataAtendimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  switch (atestado.tipo) {
    case 'comparecimento':
      texto = `Atesto para os devidos fins que ${paciente.nome}${paciente.cpf ? `, CPF: ${paciente.cpf}` : ''}, compareceu a esta clínica no dia ${dataAtend} para consulta médica.`;
      break;
    case 'afastamento':
      texto = `Atesto para os devidos fins que ${paciente.nome}${paciente.cpf ? `, CPF: ${paciente.cpf}` : ''}, esteve sob meus cuidados profissionais no dia ${dataAtend} e necessita de afastamento de suas atividades por ${atestado.diasAfastamento || 1} dia(s), a partir desta data.`;
      if (atestado.cid) {
        texto += `\n\nCID-10: ${atestado.cid}`;
      }
      break;
    case 'aptidao':
      texto = `Atesto para os devidos fins que ${paciente.nome}${paciente.cpf ? `, CPF: ${paciente.cpf}` : ''}, foi submetido(a) a exame clínico nesta data e encontra-se APTO(A) para exercer suas atividades físicas e/ou laborais.`;
      break;
    case 'acompanhante':
      texto = `Declaro para os devidos fins que ${paciente.nome}${paciente.cpf ? `, CPF: ${paciente.cpf}` : ''}, acompanhou paciente sob meus cuidados nesta clínica no dia ${dataAtend}.`;
      break;
  }

  // Texto do atestado
  const lines = doc.splitTextToSize(texto, 160);
  doc.text(lines, 25, 75);

  // Observações
  if (atestado.observacoes) {
    const obsY = 75 + lines.length * 6 + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 25, obsY);
    doc.setFont('helvetica', 'normal');
    const obsLines = doc.splitTextToSize(atestado.observacoes, 160);
    doc.text(obsLines, 25, obsY + 7);
  }

  // Data e local
  doc.text(`São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`, 25, 180);

  // Assinatura
  doc.line(60, 220, 150, 220);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(medico.nome, 105, 227, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`CRM: ${medico.crm || 'N/A'} | ${medico.especialidade || ''}`, 105, 233, { align: 'center' });

  addFooter(doc);

  return doc;
}

// Gerar relatório financeiro
export function gerarRelatorioFinanceiro(
  dados: {
    periodo: string;
    receitas: number;
    despesas: number;
    lucro: number;
    lancamentos: Array<{
      data: string;
      tipo: string;
      categoria: string;
      descricao: string;
      valor: number;
      status: string;
    }>;
  }
) {
  const doc = new jsPDF();

  addHeader(doc, 'RELATÓRIO FINANCEIRO');

  // Período
  doc.setFontSize(10);
  doc.text(`Período: ${dados.periodo}`, 20, 60);

  // Resumo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO', 20, 75);

  const resumoData = [
    ['Total de Receitas', formatCurrency(dados.receitas)],
    ['Total de Despesas', formatCurrency(dados.despesas)],
    ['Lucro/Prejuízo', formatCurrency(dados.lucro)],
  ];

  autoTable(doc, {
    startY: 80,
    head: [['Indicador', 'Valor']],
    body: resumoData,
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204] },
    margin: { left: 20, right: 20 },
    tableWidth: 80,
  });

  // Detalhamento
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALHAMENTO', 20, (doc as any).lastAutoTable.finalY + 15);

  const detalhes = dados.lancamentos.map((l) => [
    l.data,
    l.tipo.toUpperCase(),
    l.categoria,
    l.descricao,
    formatCurrency(l.valor),
    l.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status']],
    body: detalhes,
    theme: 'striped',
    headStyles: { fillColor: [0, 102, 204], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 20, right: 20 },
  });

  addFooter(doc);

  return doc;
}

// Gerar etiqueta de paciente
export function gerarEtiquetaPaciente(
  pacientes: Array<{
    nome: string;
    cpf: string;
    dataNascimento: string;
    telefone: string;
    convenio?: string;
    numeroCarteira?: string;
  }>,
  tamanho: 'pequena' | 'media' | 'grande' = 'media'
) {
  const sizes = {
    pequena: { width: 80, height: 30, fontSize: 7 },
    media: { width: 100, height: 40, fontSize: 8 },
    grande: { width: 120, height: 50, fontSize: 9 },
  };

  const size = sizes[tamanho];
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [size.width, size.height],
  });

  pacientes.forEach((paciente, index) => {
    if (index > 0) {
      doc.addPage([size.width, size.height], 'landscape');
    }

    doc.setFontSize(size.fontSize + 2);
    doc.setFont('helvetica', 'bold');
    doc.text(paciente.nome.toUpperCase(), 3, 8);

    doc.setFontSize(size.fontSize);
    doc.setFont('helvetica', 'normal');
    doc.text(`CPF: ${paciente.cpf}`, 3, 14);
    doc.text(`Nasc: ${format(new Date(paciente.dataNascimento), 'dd/MM/yyyy')}`, 3, 19);
    doc.text(`Tel: ${paciente.telefone}`, 3, 24);

    if (paciente.convenio) {
      doc.text(`Conv: ${paciente.convenio}`, 3, 29);
      if (paciente.numeroCarteira) {
        doc.text(`Cart: ${paciente.numeroCarteira}`, 3, 34);
      }
    }
  });

  return doc;
}

// Gerar relatório de atendimentos
export function gerarRelatorioAtendimentos(
  dados: {
    periodo: string;
    totalAtendimentos: number;
    porMedico: Array<{ nome: string; atendimentos: number; taxa: number }>;
    porTipo: Array<{ tipo: string; quantidade: number }>;
  }
) {
  const doc = new jsPDF();

  addHeader(doc, 'RELATÓRIO DE ATENDIMENTOS');

  doc.setFontSize(10);
  doc.text(`Período: ${dados.periodo}`, 20, 60);
  doc.text(`Total de Atendimentos: ${dados.totalAtendimentos}`, 20, 67);

  // Por Médico
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ATENDIMENTOS POR MÉDICO', 20, 82);

  autoTable(doc, {
    startY: 87,
    head: [['Médico', 'Atendimentos', 'Taxa de Conclusão']],
    body: dados.porMedico.map((m) => [m.nome, m.atendimentos.toString(), `${m.taxa}%`]),
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204] },
    margin: { left: 20, right: 20 },
  });

  // Por Tipo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ATENDIMENTOS POR TIPO', 20, (doc as any).lastAutoTable.finalY + 15);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Tipo', 'Quantidade']],
    body: dados.porTipo.map((t) => [t.tipo, t.quantidade.toString()]),
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204] },
    margin: { left: 20, right: 20 },
    tableWidth: 100,
  });

  addFooter(doc);

  return doc;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Download PDF
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Abrir PDF em nova janela
export function openPDF(doc: jsPDF) {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
