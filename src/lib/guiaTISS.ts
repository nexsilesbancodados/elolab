import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GuiaTISSData {
  // Dados da clínica
  clinicaNome: string;
  clinicaCNES?: string;
  clinicaCNPJ?: string;
  
  // Dados do paciente
  pacienteNome: string;
  pacienteCPF?: string;
  pacienteCarteira?: string;
  
  // Dados do convênio
  convenioNome: string;
  convenioCodigo: string;
  
  // Dados do médico
  medicoNome: string;
  medicoCRM: string;
  medicoUF?: string;
  medicoCBOS?: string;
  
  // Dados do atendimento
  dataAtendimento: string;
  tipoAtendimento: string;
  caraterAtendimento?: string;
  
  // Procedimentos
  procedimentos: Array<{
    codigoTUSS: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
  }>;
  
  // Número da guia
  numeroGuia?: string;
  senhaAutorizacao?: string;
}

export function gerarGuiaTISS(data: GuiaTISSData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pw - margin * 2;
  let y = margin;

  // Helper functions
  const drawBox = (x: number, yPos: number, w: number, h: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(x, yPos, w, h);
  };

  const drawLabel = (label: string, value: string, x: number, yPos: number, w: number, h: number = 10) => {
    drawBox(x, yPos, w, h);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(label, x + 1, yPos + 3);
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(value || '', x + 1, yPos + 7.5);
  };

  // === HEADER ===
  doc.setFillColor(0, 100, 180);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255);
  doc.text('GUIA DE CONSULTA / SP-SADT', pw / 2, y + 5.5, { align: 'center' });
  y += 10;

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text('Padrão TISS - Troca de Informações em Saúde Suplementar', pw / 2, y + 3, { align: 'center' });
  y += 6;

  // === 1. REGISTRO ANS / GUIA ===
  doc.setFillColor(230, 240, 250);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 80, 160);
  doc.text('1 - Registro ANS', margin + 2, y + 4);
  y += 6;

  const col3 = contentWidth / 3;
  drawLabel('Nº Guia Prestador', data.numeroGuia || 'AUTO', margin, y, col3);
  drawLabel('Nº Guia Operadora', data.senhaAutorizacao || '', margin + col3, y, col3);
  drawLabel('Data Autorização', format(new Date(), 'dd/MM/yyyy'), margin + col3 * 2, y, col3);
  y += 12;

  // === 2. DADOS DO BENEFICIÁRIO ===
  doc.setFillColor(230, 240, 250);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 80, 160);
  doc.text('2 - Dados do Beneficiário', margin + 2, y + 4);
  y += 6;

  drawLabel('Nº da Carteira', data.pacienteCarteira || '', margin, y, contentWidth * 0.3);
  drawLabel('Nome', data.pacienteNome, margin + contentWidth * 0.3, y, contentWidth * 0.5);
  drawLabel('CPF', data.pacienteCPF || '', margin + contentWidth * 0.8, y, contentWidth * 0.2);
  y += 12;

  // === 3. DADOS DO CONTRATADO (CLÍNICA) ===
  doc.setFillColor(230, 240, 250);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 80, 160);
  doc.text('3 - Dados do Contratado Executante', margin + 2, y + 4);
  y += 6;

  drawLabel('Código na Operadora / CNES', data.clinicaCNES || '', margin, y, contentWidth * 0.3);
  drawLabel('Nome do Contratado', data.clinicaNome, margin + contentWidth * 0.3, y, contentWidth * 0.5);
  drawLabel('CNPJ', data.clinicaCNPJ || '', margin + contentWidth * 0.8, y, contentWidth * 0.2);
  y += 12;

  // === 4. DADOS DO PROFISSIONAL ===
  doc.setFillColor(230, 240, 250);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 80, 160);
  doc.text('4 - Dados do Profissional Executante / Solicitante', margin + 2, y + 4);
  y += 6;

  const col4 = contentWidth / 4;
  drawLabel('Nome do Profissional', data.medicoNome, margin, y, col4 * 2);
  drawLabel('Conselho', 'CRM', margin + col4 * 2, y, col4 * 0.5);
  drawLabel('Nº Conselho', data.medicoCRM, margin + col4 * 2.5, y, col4 * 0.75);
  drawLabel('UF', data.medicoUF || 'SP', margin + col4 * 3.25, y, col4 * 0.75);
  y += 12;

  drawLabel('Código CBO-S', data.medicoCBOS || '', margin, y, col4);
  drawLabel('Data do Atendimento', format(parseISO(data.dataAtendimento), 'dd/MM/yyyy'), margin + col4, y, col4);
  drawLabel('Tipo de Atendimento', data.tipoAtendimento, margin + col4 * 2, y, col4);
  drawLabel('Caráter do Atendimento', data.caraterAtendimento || 'Eletivo', margin + col4 * 3, y, col4);
  y += 12;

  // === 5. DADOS DO ATENDIMENTO / PROCEDIMENTOS ===
  doc.setFillColor(230, 240, 250);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 80, 160);
  doc.text('5 - Dados do Atendimento / Procedimentos Realizados', margin + 2, y + 4);
  y += 6;

  // Table header
  const colWidths = [contentWidth * 0.15, contentWidth * 0.45, contentWidth * 0.1, contentWidth * 0.15, contentWidth * 0.15];
  const headers = ['Cód. TUSS', 'Descrição', 'Qtd.', 'Valor Unit.', 'Valor Total'];
  
  doc.setFillColor(240, 245, 250);
  doc.rect(margin, y, contentWidth, 7, 'F');
  drawBox(margin, y, contentWidth, 7);
  
  let xPos = margin;
  headers.forEach((h, i) => {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text(h, xPos + 1, y + 4.5);
    if (i < headers.length - 1) {
      doc.line(xPos + colWidths[i], y, xPos + colWidths[i], y + 7);
    }
    xPos += colWidths[i];
  });
  y += 7;

  // Table rows
  let totalGeral = 0;
  data.procedimentos.forEach((proc) => {
    const total = proc.quantidade * proc.valorUnitario;
    totalGeral += total;

    drawBox(margin, y, contentWidth, 7);
    xPos = margin;
    
    const values = [
      proc.codigoTUSS,
      proc.descricao,
      String(proc.quantidade),
      formatCurrency(proc.valorUnitario),
      formatCurrency(total),
    ];

    values.forEach((v, i) => {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.text(v, xPos + 1, y + 4.5);
      if (i < values.length - 1) {
        doc.line(xPos + colWidths[i], y, xPos + colWidths[i], y + 7);
      }
      xPos += colWidths[i];
    });
    y += 7;
  });

  // Total row
  doc.setFillColor(230, 240, 250);
  doc.rect(margin, y, contentWidth, 8, 'F');
  drawBox(margin, y, contentWidth, 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('VALOR TOTAL:', margin + contentWidth * 0.55, y + 5.5);
  doc.text(formatCurrency(totalGeral), margin + contentWidth * 0.85, y + 5.5);
  y += 12;

  // === 6. CONVÊNIO ===
  drawLabel('Operadora / Convênio', data.convenioNome, margin, y, contentWidth * 0.6);
  drawLabel('Código Operadora', data.convenioCodigo, margin + contentWidth * 0.6, y, contentWidth * 0.4);
  y += 14;

  // === ASSINATURAS ===
  const sigWidth = (contentWidth - 10) / 2;
  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + sigWidth, y);
  doc.line(margin + sigWidth + 10, y, margin + sigWidth * 2 + 10, y);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Assinatura do Beneficiário', margin + sigWidth / 2, y + 4, { align: 'center' });
  doc.text('Assinatura do Profissional', margin + sigWidth + 10 + sigWidth / 2, y + 4, { align: 'center' });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(
    `Guia gerada em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | ${data.clinicaNome} | Sistema EloLab`,
    pw / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  return doc;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseISO(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}
