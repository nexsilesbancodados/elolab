import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FilaAtendimento, Agendamento, Paciente, User } from '@/types';
import { getAll } from '@/lib/localStorage';
import { cn } from '@/lib/utils';

export default function PainelTV() {
  const [fila, setFila] = useState<FilaAtendimento[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chamadoAtual, setChamadoAtual] = useState<FilaAtendimento | null>(null);

  useEffect(() => {
    loadData();
    const dataInterval = setInterval(loadData, 5000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    // Check for newly called patients
    const chamado = fila.find((f) => f.status === 'chamado');
    if (chamado && chamado.id !== chamadoAtual?.id) {
      setChamadoAtual(chamado);
      // Play sound notification
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    }
  }, [fila]);

  const loadData = () => {
    setFila(getAll<FilaAtendimento>('fila'));
    setAgendamentos(getAll<Agendamento>('agendamentos'));
    setPacientes(getAll<Paciente>('pacientes'));
    setMedicos(getAll<User>('users').filter((u) => u.role === 'medico'));
  };

  const getPacienteNome = (agendamentoId: string) => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return 'Desconhecido';
    const paciente = pacientes.find((p) => p.id === ag.pacienteId);
    return paciente?.nome || 'Desconhecido';
  };

  const getMedicoNome = (agendamentoId: string) => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return '';
    const medico = medicos.find((m) => m.id === ag.medicoId);
    return medico?.nome || '';
  };

  const filaAguardando = fila
    .filter((f) => f.status === 'aguardando')
    .sort((a, b) => a.posicao - b.posicao);

  const emAtendimento = fila
    .filter((f) => f.status === 'em_atendimento')
    .sort((a, b) => a.posicao - b.posicao);

  const chamados = fila.filter((f) => f.status === 'chamado');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-primary">EloLab Clínica</h1>
          <p className="text-xl text-muted-foreground">Painel de Atendimento</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold text-foreground">
            {format(currentTime, 'HH:mm')}
          </p>
          <p className="text-xl text-muted-foreground">
            {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </header>

      {/* Chamada Atual - Destaque */}
      {chamados.length > 0 && (
        <div className="mb-8 animate-pulse">
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 shadow-lg">
            <p className="text-2xl mb-2">Chamando:</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-5xl font-bold mb-2">
                  {getPacienteNome(chamados[0].agendamentoId)}
                </p>
                <p className="text-2xl opacity-80">
                  {getMedicoNome(chamados[0].agendamentoId)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {chamados[0].sala || 'Recepção'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Em Atendimento */}
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-purple-600 text-white p-4">
            <h2 className="text-2xl font-bold">Em Atendimento</h2>
          </div>
          <div className="p-4">
            {emAtendimento.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-lg">
                Nenhum atendimento em andamento
              </p>
            ) : (
              <div className="space-y-4">
                {emAtendimento.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 bg-purple-50 rounded-lg"
                  >
                    <div>
                      <p className="text-xl font-semibold">
                        {getPacienteNome(item.agendamentoId)}
                      </p>
                      <p className="text-muted-foreground">
                        {getMedicoNome(item.agendamentoId)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-lg font-medium">
                        {item.sala}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Aguardando */}
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-secondary text-secondary-foreground p-4">
            <h2 className="text-2xl font-bold">Aguardando</h2>
          </div>
          <div className="p-4">
            {filaAguardando.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-lg">
                Nenhum paciente aguardando
              </p>
            ) : (
              <div className="space-y-3">
                {filaAguardando.slice(0, 8).map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex justify-between items-center p-4 rounded-lg',
                      index === 0 ? 'bg-yellow-50' : 'bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
                          index === 0
                            ? 'bg-yellow-500 text-white'
                            : 'bg-muted-foreground/20 text-muted-foreground'
                        )}
                      >
                        {item.posicao}
                      </span>
                      <div>
                        <p className="text-lg font-medium">
                          {getPacienteNome(item.agendamentoId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getMedicoNome(item.agendamentoId)}
                        </p>
                      </div>
                    </div>
                    <span className="text-muted-foreground">
                      {format(new Date(item.horarioChegada), 'HH:mm')}
                    </span>
                  </div>
                ))}
                {filaAguardando.length > 8 && (
                  <p className="text-center text-muted-foreground mt-4">
                    E mais {filaAguardando.length - 8} pacientes...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-muted-foreground">
        <p>Por favor, aguarde seu nome ser chamado e dirija-se ao local indicado.</p>
      </footer>
    </div>
  );
}
