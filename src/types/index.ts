// User & Auth Types
export type UserRole = 'admin' | 'medico' | 'recepcao' | 'enfermagem' | 'financeiro';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar?: string;
  crm?: string;
  especialidade?: string;
  ativo: boolean;
  criadoEm: string;
}

// Patient Types
export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email?: string;
  endereco: Endereco;
  convenio?: Convenio;
  alergias: string[];
  observacoes?: string;
  criadoEm: string;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface Convenio {
  nome: string;
  numeroCarteira: string;
  validade: string;
}

// Appointment Types
export type StatusAgendamento = 'agendado' | 'confirmado' | 'aguardando' | 'em_atendimento' | 'finalizado' | 'cancelado' | 'faltou';

export interface Agendamento {
  id: string;
  pacienteId: string;
  paciente?: Paciente;
  medicoId: string;
  medico?: User;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: 'consulta' | 'retorno' | 'exame' | 'procedimento';
  status: StatusAgendamento;
  observacoes?: string;
  criadoEm: string;
}

// Queue Types
export interface FilaAtendimento {
  id: string;
  agendamentoId: string;
  agendamento?: Agendamento;
  posicao: number;
  horarioChegada: string;
  status: 'aguardando' | 'chamado' | 'em_atendimento' | 'finalizado';
  sala?: string;
}

// Medical Record Types
export interface Prontuario {
  id: string;
  pacienteId: string;
  medicoId: string;
  agendamentoId: string;
  data: string;
  queixaPrincipal: string;
  historiaDoencaAtual: string;
  examesFisicos: string;
  hipoteseDiagnostica: string;
  conduta: string;
  prescricoes: Prescricao[];
  criadoEm: string;
}

export interface Prescricao {
  id: string;
  medicamento: string;
  dosagem: string;
  posologia: string;
  duracao: string;
  observacoes?: string;
}

// Financial Types
export type StatusPagamento = 'pendente' | 'pago' | 'cancelado' | 'estornado';

export interface Lancamento {
  id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: StatusPagamento;
  pacienteId?: string;
  agendamentoId?: string;
  formaPagamento?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'convenio';
  criadoEm: string;
}

// Dashboard Types
export interface DashboardStats {
  pacientesHoje: number;
  consultasAgendadas: number;
  faturamentoMes: number;
  taxaOcupacao: number;
}
