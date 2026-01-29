export interface PrescriptionTemplate {
  id: string;
  nome: string;
  tipo: 'simples' | 'controle_especial' | 'antimicrobiano';
  medicamentos: {
    nome: string;
    dosagem: string;
    posologia: string;
    quantidade: string;
    observacoes?: string;
  }[];
  observacoesGerais?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface CertificateTemplate {
  id: string;
  nome: string;
  tipo: 'comparecimento' | 'afastamento' | 'aptidao' | 'acompanhante';
  conteudo: string;
  diasAfastamento?: number;
  cid?: string;
  criadoEm: string;
  atualizadoEm?: string;
}
