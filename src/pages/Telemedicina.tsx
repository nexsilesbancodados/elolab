import { useState, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  User,
  Settings,
  Maximize2,
  Camera,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Agendamento, Paciente, User as UserType } from '@/types';
import { getAll } from '@/lib/localStorage';
import { cn } from '@/lib/utils';

interface ConsultaTelemedicina {
  id: string;
  agendamentoId: string;
  paciente: Paciente;
  medico: UserType;
  horaInicio: string;
  status: 'aguardando' | 'em_andamento' | 'finalizada';
}

export default function Telemedicina() {
  const [consultas, setConsultas] = useState<ConsultaTelemedicina[]>([]);
  const [consultaSelecionada, setConsultaSelecionada] = useState<ConsultaTelemedicina | null>(null);
  const [emChamada, setEmChamada] = useState(false);
  const [videoAtivo, setVideoAtivo] = useState(true);
  const [micAtivo, setMicAtivo] = useState(true);
  const [mensagens, setMensagens] = useState<Array<{ remetente: string; texto: string; hora: string }>>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    carregarConsultas();
  }, []);

  const carregarConsultas = () => {
    const agendamentos = getAll<Agendamento>('agendamentos');
    const pacientes = getAll<Paciente>('pacientes');
    const usuarios = getAll<UserType>('users');

    // Filtrar consultas de telemedicina do dia
    const hoje = format(new Date(), 'yyyy-MM-dd');
    const teleconsultas = agendamentos
      .filter((a) => a.tipo === 'telemedicina' && a.data === hoje && a.status !== 'cancelado')
      .map((a) => ({
        id: a.id,
        agendamentoId: a.id,
        paciente: pacientes.find((p) => p.id === a.pacienteId)!,
        medico: usuarios.find((u) => u.id === a.medicoId)!,
        horaInicio: a.horaInicio,
        status: 'aguardando' as const,
      }))
      .filter((c) => c.paciente && c.medico);

    setConsultas(teleconsultas);
  };

  const iniciarChamada = () => {
    if (!consultaSelecionada) return;

    setEmChamada(true);
    setMensagens([
      {
        remetente: 'Sistema',
        texto: 'Chamada iniciada. Aguardando conexão...',
        hora: format(new Date(), 'HH:mm'),
      },
    ]);

    toast({
      title: 'Chamada iniciada',
      description: `Teleconsulta com ${consultaSelecionada.paciente.nome}`,
    });
  };

  const encerrarChamada = () => {
    setEmChamada(false);
    toast({
      title: 'Chamada encerrada',
      description: 'A teleconsulta foi finalizada.',
    });
  };

  const enviarMensagem = () => {
    if (!novaMensagem.trim()) return;

    setMensagens([
      ...mensagens,
      {
        remetente: 'Você',
        texto: novaMensagem,
        hora: format(new Date(), 'HH:mm'),
      },
    ]);
    setNovaMensagem('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Telemedicina</h1>
          <p className="text-muted-foreground">Consultas por videochamada</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Sistema Online
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Consultas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Consultas de Hoje
            </CardTitle>
            <CardDescription>
              {consultas.length} teleconsulta(s) agendada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {consultas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma teleconsulta agendada para hoje</p>
                    <p className="text-sm">Agende consultas do tipo "Telemedicina" na Agenda</p>
                  </div>
                ) : (
                  consultas.map((consulta) => (
                    <Card
                      key={consulta.id}
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary',
                        consultaSelecionada?.id === consulta.id && 'border-primary bg-primary/5'
                      )}
                      onClick={() => setConsultaSelecionada(consulta)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {consulta.paciente.nome.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{consulta.paciente.nome}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {consulta.horaInicio}
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              consulta.status === 'aguardando' && 'bg-yellow-100 text-yellow-800',
                              consulta.status === 'em_andamento' && 'bg-green-100 text-green-800',
                              consulta.status === 'finalizada' && 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {consulta.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de Vídeo */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {!consultaSelecionada ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
                <Video className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Selecione uma consulta</p>
                <p className="text-sm">Escolha uma teleconsulta na lista ao lado</p>
              </div>
            ) : !emChamada ? (
              <div className="flex flex-col items-center justify-center h-[600px] bg-gradient-to-b from-muted/50 to-muted">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-3xl">
                    {consultaSelecionada.paciente.nome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-2">{consultaSelecionada.paciente.nome}</h2>
                <p className="text-muted-foreground mb-6">
                  Horário: {consultaSelecionada.horaInicio}
                </p>
                <Button size="lg" className="gap-2" onClick={iniciarChamada}>
                  <Video className="h-5 w-5" />
                  Iniciar Videochamada
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Certifique-se que sua câmera e microfone estão funcionando
                </p>
              </div>
            ) : (
              <div className="relative h-[600px] bg-gray-900 rounded-lg overflow-hidden">
                {/* Vídeo Principal (Simulado) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Avatar className="h-32 w-32 mx-auto mb-4">
                      <AvatarFallback className="text-4xl bg-primary">
                        {consultaSelecionada.paciente.nome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xl">{consultaSelecionada.paciente.nome}</p>
                    <p className="text-sm text-gray-400 mt-2">Conectado</p>
                  </div>
                </div>

                {/* Vídeo do Médico (Picture-in-Picture Simulado) */}
                <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
                  <div className="flex items-center justify-center h-full">
                    {videoAtivo ? (
                      <User className="h-12 w-12 text-gray-500" />
                    ) : (
                      <VideoOff className="h-12 w-12 text-red-500" />
                    )}
                  </div>
                </div>

                {/* Duração da Chamada */}
                <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Em chamada
                </div>

                {/* Controles */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/50 px-4 py-2 rounded-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'rounded-full text-white hover:bg-white/20',
                      !micAtivo && 'bg-red-500 hover:bg-red-600'
                    )}
                    onClick={() => setMicAtivo(!micAtivo)}
                  >
                    {micAtivo ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'rounded-full text-white hover:bg-white/20',
                      !videoAtivo && 'bg-red-500 hover:bg-red-600'
                    )}
                    onClick={() => setVideoAtivo(!videoAtivo)}
                  >
                    {videoAtivo ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20">
                    <Monitor className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    className="rounded-full bg-red-500 hover:bg-red-600 h-12 w-12"
                    onClick={encerrarChamada}
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Painel Inferior - Chat e Anotações */}
      {consultaSelecionada && emChamada && (
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="anotacoes" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Anotações
                </TabsTrigger>
                <TabsTrigger value="paciente" className="gap-2">
                  <User className="h-4 w-4" />
                  Dados do Paciente
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="p-4 m-0">
                <div className="flex flex-col h-48">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-3">
                      {mensagens.map((msg, index) => (
                        <div
                          key={index}
                          className={cn(
                            'flex gap-2',
                            msg.remetente === 'Você' && 'justify-end'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg px-3 py-2',
                              msg.remetente === 'Você'
                                ? 'bg-primary text-primary-foreground'
                                : msg.remetente === 'Sistema'
                                ? 'bg-muted text-muted-foreground italic'
                                : 'bg-secondary'
                            )}
                          >
                            {msg.remetente !== 'Você' && (
                              <p className="text-xs font-medium mb-1">{msg.remetente}</p>
                            )}
                            <p className="text-sm">{msg.texto}</p>
                            <p className="text-xs opacity-70 mt-1">{msg.hora}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 mt-4">
                    <Input
                      value={novaMensagem}
                      onChange={(e) => setNovaMensagem(e.target.value)}
                      placeholder="Digite uma mensagem..."
                      onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
                    />
                    <Button onClick={enviarMensagem}>Enviar</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="anotacoes" className="p-4 m-0">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Anote informações importantes durante a consulta. Estas anotações serão salvas no prontuário.
                  </p>
                  <Textarea
                    value={anotacoes}
                    onChange={(e) => setAnotacoes(e.target.value)}
                    placeholder="Anotações da teleconsulta..."
                    rows={6}
                  />
                  <Button variant="outline" size="sm">
                    Salvar Anotações
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="paciente" className="p-4 m-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{consultaSelecionada.paciente.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{consultaSelecionada.paciente.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{consultaSelecionada.paciente.telefone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Convênio</p>
                    <p className="font-medium">{consultaSelecionada.paciente.convenio?.nome || 'Particular'}</p>
                  </div>
                  {consultaSelecionada.paciente.alergias?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Alergias</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {consultaSelecionada.paciente.alergias.map((alergia, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {alergia}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Instruções quando não há chamada ativa */}
      {!emChamada && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Camera className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Verifique sua Câmera</h3>
                  <p className="text-sm text-muted-foreground">
                    Certifique-se que a câmera está funcionando
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <Mic className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Teste o Microfone</h3>
                  <p className="text-sm text-muted-foreground">
                    O áudio precisa estar funcionando
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Monitor className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Conexão Estável</h3>
                  <p className="text-sm text-muted-foreground">
                    Recomendamos conexão de banda larga
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
