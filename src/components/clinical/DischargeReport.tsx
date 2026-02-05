import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';

interface DischargeReportProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    paciente: {
      nome: string;
      dataNascimento?: string;
      cpf?: string;
    };
    medico: {
      nome: string;
      crm?: string;
      especialidade?: string;
    };
    consulta: {
      data: string;
      queixaPrincipal?: string;
      hipoteseDiagnostica?: string;
      conduta?: string;
    };
    prescricoes?: {
      medicamento: string;
      dosagem?: string;
      posologia?: string;
      duracao?: string;
    }[];
    orientacoes?: string;
    retorno?: {
      data?: string;
      motivo?: string;
    };
  };
  clinicaNome?: string;
}

export function DischargeReport({ 
  isOpen, 
  onClose, 
  data,
  clinicaNome = 'EloLab Clínica'
}: DischargeReportProps) {
  const calcularIdade = (dataNascimento?: string) => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(clinicaNome, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(14);
    doc.text('RELATÓRIO DE ALTA / RESUMO DE ATENDIMENTO', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Patient info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO PACIENTE', 20, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${data.paciente.nome}`, 20, y);
    y += 5;
    
    if (data.paciente.cpf) {
      doc.text(`CPF: ${data.paciente.cpf}`, 20, y);
      y += 5;
    }
    
    const idade = calcularIdade(data.paciente.dataNascimento);
    if (idade) {
      doc.text(`Idade: ${idade} anos`, 20, y);
      y += 5;
    }
    y += 5;

    // Consultation info
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO ATENDIMENTO', 20, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${format(new Date(data.consulta.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 20, y);
    y += 5;
    doc.text(`Médico: Dr(a). ${data.medico.nome}${data.medico.crm ? ` - CRM ${data.medico.crm}` : ''}`, 20, y);
    y += 5;
    if (data.medico.especialidade) {
      doc.text(`Especialidade: ${data.medico.especialidade}`, 20, y);
      y += 5;
    }
    y += 5;

    // Clinical info
    if (data.consulta.queixaPrincipal) {
      doc.setFont('helvetica', 'bold');
      doc.text('QUEIXA PRINCIPAL:', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(data.consulta.queixaPrincipal, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 5;
    }

    if (data.consulta.hipoteseDiagnostica) {
      doc.setFont('helvetica', 'bold');
      doc.text('HIPÓTESE DIAGNÓSTICA:', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(data.consulta.hipoteseDiagnostica, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 5;
    }

    if (data.consulta.conduta) {
      doc.setFont('helvetica', 'bold');
      doc.text('CONDUTA:', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(data.consulta.conduta, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 5;
    }

    // Prescriptions
    if (data.prescricoes && data.prescricoes.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('PRESCRIÇÕES:', 20, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      data.prescricoes.forEach((p, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${index + 1}. ${p.medicamento}${p.dosagem ? ` - ${p.dosagem}` : ''}`, 25, y);
        y += 4;
        if (p.posologia) {
          doc.text(`   Posologia: ${p.posologia}`, 25, y);
          y += 4;
        }
        if (p.duracao) {
          doc.text(`   Duração: ${p.duracao}`, 25, y);
          y += 4;
        }
        y += 2;
      });
      y += 3;
    }

    // Orientations
    if (data.orientacoes) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('ORIENTAÇÕES:', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(data.orientacoes, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 5;
    }

    // Return
    if (data.retorno?.data) {
      doc.setFont('helvetica', 'bold');
      doc.text('RETORNO:', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`Data prevista: ${format(new Date(data.retorno.data), "dd/MM/yyyy", { locale: ptBR })}`, 20, y);
      if (data.retorno.motivo) {
        y += 5;
        doc.text(`Motivo: ${data.retorno.motivo}`, 20, y);
      }
      y += 10;
    }

    // Footer
    y = Math.max(y + 20, 250);
    doc.line(20, y, pageWidth - 20, y);
    y += 5;
    doc.setFontSize(8);
    doc.text(`Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`${clinicaNome} - Sistema EloLab`, pageWidth / 2, y, { align: 'center' });

    return doc;
  };

  const handlePrint = () => {
    const doc = generatePDF();
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleDownload = () => {
    const doc = generatePDF();
    doc.save(`relatorio-alta-${data.paciente.nome.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const idade = calcularIdade(data.paciente.dataNascimento);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório de Alta
          </DialogTitle>
          <DialogDescription>
            Resumo do atendimento para o paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Info */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">DADOS DO PACIENTE</h3>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-medium text-lg">{data.paciente.nome}</p>
              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                {data.paciente.cpf && <span>CPF: {data.paciente.cpf}</span>}
                {idade && <span>{idade} anos</span>}
              </div>
            </div>
          </div>

          {/* Consultation Info */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">ATENDIMENTO</h3>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Data:</span>
                <span className="font-medium">
                  {format(new Date(data.consulta.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Médico:</span>
                <span className="font-medium">
                  Dr(a). {data.medico.nome}
                  {data.medico.crm && <span className="text-muted-foreground ml-1">(CRM {data.medico.crm})</span>}
                </span>
              </div>
              {data.medico.especialidade && (
                <div className="flex justify-between">
                  <span className="text-sm">Especialidade:</span>
                  <Badge variant="secondary">{data.medico.especialidade}</Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Clinical Details */}
          {data.consulta.queixaPrincipal && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">QUEIXA PRINCIPAL</h3>
              <p className="text-sm">{data.consulta.queixaPrincipal}</p>
            </div>
          )}

          {data.consulta.hipoteseDiagnostica && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">HIPÓTESE DIAGNÓSTICA</h3>
              <p className="text-sm">{data.consulta.hipoteseDiagnostica}</p>
            </div>
          )}

          {data.consulta.conduta && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">CONDUTA</h3>
              <p className="text-sm">{data.consulta.conduta}</p>
            </div>
          )}

          {/* Prescriptions */}
          {data.prescricoes && data.prescricoes.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">PRESCRIÇÕES</h3>
              <div className="space-y-2">
                {data.prescricoes.map((p, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-medium">
                      {index + 1}. {p.medicamento}
                      {p.dosagem && <span className="text-muted-foreground"> - {p.dosagem}</span>}
                    </p>
                    <div className="text-sm text-muted-foreground mt-1">
                      {p.posologia && <span>Posologia: {p.posologia}</span>}
                      {p.duracao && <span className="ml-4">Duração: {p.duracao}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orientations */}
          {data.orientacoes && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">ORIENTAÇÕES</h3>
              <p className="text-sm whitespace-pre-wrap">{data.orientacoes}</p>
            </div>
          )}

          {/* Return */}
          {data.retorno?.data && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">RETORNO</h3>
              <div className="p-3 border rounded-lg bg-primary/5">
                <p className="font-medium">
                  {format(new Date(data.retorno.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                {data.retorno.motivo && (
                  <p className="text-sm text-muted-foreground">{data.retorno.motivo}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
