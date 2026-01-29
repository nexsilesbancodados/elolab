// Seed data for development
import { User, Paciente, Agendamento, FilaAtendimento, Lancamento } from '@/types';
import { getAll, setItem } from './localStorage';
import { generateId } from './localStorage';

export function seedDemoData() {
  // Only seed if no data exists
  if (getAll<User>('users').length > 0) return;

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Users (médicos e funcionários)
  const users: User[] = [
    {
      id: 'admin-1',
      nome: 'Administrador',
      email: 'admin@elolab.com',
      role: 'admin',
      ativo: true,
      criadoEm: now.toISOString(),
    },
    {
      id: 'med-1',
      nome: 'Dr. Carlos Silva',
      email: 'carlos@elolab.com',
      role: 'medico',
      crm: 'CRM/SP 123456',
      especialidade: 'Clínico Geral',
      ativo: true,
      criadoEm: now.toISOString(),
    },
    {
      id: 'med-2',
      nome: 'Dra. Ana Santos',
      email: 'ana@elolab.com',
      role: 'medico',
      crm: 'CRM/SP 789012',
      especialidade: 'Cardiologia',
      ativo: true,
      criadoEm: now.toISOString(),
    },
    {
      id: 'med-3',
      nome: 'Dr. Roberto Lima',
      email: 'roberto@elolab.com',
      role: 'medico',
      crm: 'CRM/SP 345678',
      especialidade: 'Pediatria',
      ativo: true,
      criadoEm: now.toISOString(),
    },
    {
      id: 'rec-1',
      nome: 'Maria Oliveira',
      email: 'maria@elolab.com',
      role: 'recepcao',
      ativo: true,
      criadoEm: now.toISOString(),
    },
    {
      id: 'enf-1',
      nome: 'Julia Costa',
      email: 'julia@elolab.com',
      role: 'enfermagem',
      ativo: true,
      criadoEm: now.toISOString(),
    },
    {
      id: 'fin-1',
      nome: 'Pedro Souza',
      email: 'pedro@elolab.com',
      role: 'financeiro',
      ativo: true,
      criadoEm: now.toISOString(),
    },
  ];
  setItem('users', users);

  // Pacientes
  const pacientes: Paciente[] = [
    {
      id: 'pac-1',
      nome: 'João da Silva',
      cpf: '123.456.789-00',
      dataNascimento: '1985-03-15',
      telefone: '(11) 99999-1111',
      email: 'joao@email.com',
      endereco: {
        cep: '01310-100',
        logradouro: 'Av. Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
      },
      convenio: {
        nome: 'Unimed',
        numeroCarteira: '123456789',
        validade: '2025-12-31',
      },
      alergias: ['Dipirona'],
      criadoEm: now.toISOString(),
    },
    {
      id: 'pac-2',
      nome: 'Maria Fernandes',
      cpf: '987.654.321-00',
      dataNascimento: '1990-07-22',
      telefone: '(11) 99999-2222',
      email: 'maria.f@email.com',
      endereco: {
        cep: '04543-000',
        logradouro: 'Rua Funchal',
        numero: '500',
        bairro: 'Vila Olímpia',
        cidade: 'São Paulo',
        estado: 'SP',
      },
      alergias: [],
      criadoEm: now.toISOString(),
    },
    {
      id: 'pac-3',
      nome: 'Carlos Eduardo Mendes',
      cpf: '456.789.123-00',
      dataNascimento: '1978-11-08',
      telefone: '(11) 99999-3333',
      endereco: {
        cep: '01414-000',
        logradouro: 'Rua Augusta',
        numero: '2000',
        bairro: 'Consolação',
        cidade: 'São Paulo',
        estado: 'SP',
      },
      convenio: {
        nome: 'Bradesco Saúde',
        numeroCarteira: '987654321',
        validade: '2024-06-30',
      },
      alergias: ['Penicilina', 'Ibuprofeno'],
      observacoes: 'Paciente diabético tipo 2',
      criadoEm: now.toISOString(),
    },
    {
      id: 'pac-4',
      nome: 'Ana Paula Costa',
      cpf: '321.654.987-00',
      dataNascimento: '1995-02-14',
      telefone: '(11) 99999-4444',
      email: 'ana.costa@email.com',
      endereco: {
        cep: '04551-060',
        logradouro: 'Rua Joaquim Floriano',
        numero: '300',
        bairro: 'Itaim Bibi',
        cidade: 'São Paulo',
        estado: 'SP',
      },
      alergias: [],
      criadoEm: now.toISOString(),
    },
    {
      id: 'pac-5',
      nome: 'Roberto Almeida Junior',
      cpf: '654.321.987-00',
      dataNascimento: '1982-09-30',
      telefone: '(11) 99999-5555',
      endereco: {
        cep: '01310-200',
        logradouro: 'Rua Haddock Lobo',
        numero: '800',
        bairro: 'Cerqueira César',
        cidade: 'São Paulo',
        estado: 'SP',
      },
      alergias: ['Lactose'],
      observacoes: 'Hipertenso, em tratamento',
      criadoEm: now.toISOString(),
    },
  ];
  setItem('pacientes', pacientes);

  // Agendamentos para hoje
  const agendamentos: Agendamento[] = [
    {
      id: 'ag-1',
      pacienteId: 'pac-1',
      medicoId: 'med-1',
      data: today,
      horaInicio: '08:00',
      horaFim: '08:30',
      tipo: 'consulta',
      status: 'finalizado',
      criadoEm: now.toISOString(),
    },
    {
      id: 'ag-2',
      pacienteId: 'pac-2',
      medicoId: 'med-1',
      data: today,
      horaInicio: '08:30',
      horaFim: '09:00',
      tipo: 'consulta',
      status: 'em_atendimento',
      criadoEm: now.toISOString(),
    },
    {
      id: 'ag-3',
      pacienteId: 'pac-3',
      medicoId: 'med-2',
      data: today,
      horaInicio: '09:00',
      horaFim: '09:30',
      tipo: 'retorno',
      status: 'aguardando',
      criadoEm: now.toISOString(),
    },
    {
      id: 'ag-4',
      pacienteId: 'pac-4',
      medicoId: 'med-1',
      data: today,
      horaInicio: '09:30',
      horaFim: '10:00',
      tipo: 'consulta',
      status: 'confirmado',
      criadoEm: now.toISOString(),
    },
    {
      id: 'ag-5',
      pacienteId: 'pac-5',
      medicoId: 'med-3',
      data: today,
      horaInicio: '10:00',
      horaFim: '10:30',
      tipo: 'exame',
      status: 'agendado',
      criadoEm: now.toISOString(),
    },
  ];
  setItem('agendamentos', agendamentos);

  // Fila de atendimento
  const fila: FilaAtendimento[] = [
    {
      id: 'fila-1',
      agendamentoId: 'ag-2',
      posicao: 1,
      horarioChegada: `${today}T08:25:00`,
      status: 'em_atendimento',
      sala: 'Consultório 1',
    },
    {
      id: 'fila-2',
      agendamentoId: 'ag-3',
      posicao: 2,
      horarioChegada: `${today}T08:45:00`,
      status: 'aguardando',
    },
    {
      id: 'fila-3',
      agendamentoId: 'ag-4',
      posicao: 3,
      horarioChegada: `${today}T09:20:00`,
      status: 'aguardando',
    },
  ];
  setItem('fila', fila);

  // Lançamentos financeiros
  const lancamentos: Lancamento[] = [
    {
      id: 'lanc-1',
      tipo: 'receita',
      categoria: 'Consulta',
      descricao: 'Consulta particular - João da Silva',
      valor: 250,
      data: today,
      status: 'pago',
      pacienteId: 'pac-1',
      agendamentoId: 'ag-1',
      formaPagamento: 'pix',
      criadoEm: now.toISOString(),
    },
    {
      id: 'lanc-2',
      tipo: 'receita',
      categoria: 'Consulta',
      descricao: 'Consulta convênio - Maria Fernandes',
      valor: 180,
      data: today,
      status: 'pendente',
      pacienteId: 'pac-2',
      formaPagamento: 'convenio',
      criadoEm: now.toISOString(),
    },
    {
      id: 'lanc-3',
      tipo: 'despesa',
      categoria: 'Material',
      descricao: 'Material de escritório',
      valor: 150,
      data: today,
      status: 'pago',
      formaPagamento: 'cartao_credito',
      criadoEm: now.toISOString(),
    },
  ];
  setItem('lancamentos', lancamentos);

  console.log('Demo data seeded successfully');
}
