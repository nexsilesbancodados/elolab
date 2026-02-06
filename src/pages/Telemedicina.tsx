import { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  Calendar,
  Clock,
  User,
  FileText,
  Camera,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAgendamentos, usePacientes, useMedicos } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';

interface TeleconsultaData {
  id: string;
  pacienteNome: string;
  pacienteTelefone: string;
  pacienteEmail: string;
  medicoNome: string;
  horaInicio: string;
  data: string;
  status: 'aguardando' | 'em_andamento' | 'finalizada';
  jitsiRoomName: string;
}

export default function Telemedicina() {
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: pacientes = [] } = usePacientes();
  const { data: medicos = [] } = useMedicos();
  
  const [consultas, setConsultas] = useState<TeleconsultaData[]>([]);
  const [consultaSelecionada, setConsultaSelecionada] = useState<TeleconsultaData | null>(null);
  const [emChamada, setEmChamada] = useState(false);
  const [videoAtivo, setVideoAtivo] = useState(true);
  const [micAtivo, setMicAtivo] = useState(true);
  const [mensagens, setMensagens] = useState<Array<{ remetente: string; texto: string; hora: string }>>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    carregarConsultas();
  }, [agendamentos, pacientes, medicos]);

  const carregarConsultas = () => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    
    const teleconsultas = agendamentos
      .filter((a) => a.tipo === 'telemedicina' && a.data === hoje && a.status !== 'cancelado')
      .map((a) => {
        const paciente = pacientes.find((p) => p.id === a.paciente_id);
        const medico = medicos.find((m) => m.id === a.medico_id);
        
        if (!paciente || !medico) return null;
        
        const roomName = `elolab-${a.id.slice(0, 8)}`;
        
        return {
          id: a.id,
          pacienteNome: paciente.nome,
          pacienteTelefone: paciente.telefone || '',
          pacienteEmail: paciente.email || '',
          medicoNome: medico.crm,
          horaInicio: a.hora_inicio,
          data: a.data,
          status: 'aguardando' as const,
          jitsiRoomName: roomName,
        };
      })
      .filter(Boolean) as TeleconsultaData[];

    setConsultas(teleconsultas);
  };

  const gerarLinkJitsi = (roomName: string) => {
    return `https://meet.jit.si/${roomName}`;
  };

  const copiarLink = async () => {
    if (!consultaSelecionada) return;
    const link = gerarLinkJitsi(consultaSelecionada.jitsiRoomName);
    await navigator.clipboard.writeText(link);
    toast.success('Link copiado! Envie para o paciente.');
  };

  const iniciarChamada = () => {
    if (!consultaSelecionada) return;

    setEmChamada(true);
    setMensagens([
      {
        remetente: 'Sistema',
        texto: 'Sala de videoconferência iniciada. Aguardando paciente...',
        hora: format(new Date(), 'HH:mm'),
      },
    ]);

    // Carregar Jitsi Meet API
    if (jitsiContainerRef.current) {
      const domain = 'meet.jit.si';
      const options = {
        roomName: consultaSelecionada.jitsiRoomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: !micAtivo,
          startWithVideoMuted: !videoAtivo,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'tileview',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#1a1a2e',
        },
      };

      // @ts-ignore - Jitsi API is loaded from external script
      if (window.JitsiMeetExternalAPI) {
        // @ts-ignore
        new window.JitsiMeetExternalAPI(domain, options);
      }
    }

    toast.success('Sala de videoconferência iniciada!');
  };

  const encerrarChamada = () => {
    setEmChamada(false);
    // Limpar o container do Jitsi
    if (jitsiContainerRef.current) {
      jitsiContainerRef.current.innerHTML = '';
    }
    toast.info('Teleconsulta encerrada.');
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
      {/* Carregar Jitsi API */}
      <script src="https://meet.jit.si/external_api.js" async />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Telemedicina</h1>
          <p className="text-muted-foreground">Consultas por videochamada com Jitsi Meet</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
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
                              {consulta.pacienteNome.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{consulta.pacienteNome}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {consulta.horaInicio}
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              consulta.status === 'aguardando' && 'bg-warning/20 text-warning-foreground',
                              consulta.status === 'em_andamento' && 'bg-success/20 text-success-foreground',
                              consulta.status === 'finalizada' && 'bg-muted text-muted-foreground'
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
              <div className="flex flex-col items-center justify-center h-[600px] bg-gradient-to-b from-muted/50 to-muted p-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-3xl">
                    {consultaSelecionada.pacienteNome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-2">{consultaSelecionada.pacienteNome}</h2>
                <p className="text-muted-foreground mb-4">
                  Horário: {consultaSelecionada.horaInicio}
                </p>
                
                {/* Link da sala */}
                <div className="bg-background border rounded-lg p-4 mb-6 w-full max-w-md">
                  <p className="text-sm text-muted-foreground mb-2">Link da sala (envie para o paciente):</p>
                  <div className="flex gap-2">
                    <Input 
                      value={gerarLinkJitsi(consultaSelecionada.jitsiRoomName)} 
                      readOnly 
                      className="text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={copiarLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => window.open(gerarLinkJitsi(consultaSelecionada.jitsiRoomName), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button size="lg" className="gap-2" onClick={iniciarChamada}>
                    <Video className="h-5 w-5" />
                    Iniciar Videochamada
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  A videoconferência usa Jitsi Meet - gratuito e sem necessidade de conta
                </p>
              </div>
            ) : (
              <div className="relative h-[600px] bg-background rounded-lg overflow-hidden">
                {/* Container do Jitsi */}
                <div ref={jitsiContainerRef} className="absolute inset-0" />
                
                {/* Controles sobrepostos */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-background/80 backdrop-blur px-4 py-2 rounded-full border shadow-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'rounded-full',
                      !micAtivo && 'bg-destructive text-destructive-foreground'
                    )}
                    onClick={() => setMicAtivo(!micAtivo)}
                  >
                    {micAtivo ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'rounded-full',
                      !videoAtivo && 'bg-destructive text-destructive-foreground'
                    )}
                    onClick={() => setVideoAtivo(!videoAtivo)}
                  >
                    {videoAtivo ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Monitor className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    className="rounded-full bg-destructive hover:bg-destructive/90 h-12 w-12"
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
                    <p className="font-medium">{consultaSelecionada.pacienteNome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{consultaSelecionada.pacienteTelefone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{consultaSelecionada.pacienteEmail || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Médico</p>
                    <p className="font-medium">{consultaSelecionada.medicoNome}</p>
                  </div>
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
                <div className="p-3 rounded-full bg-info/10">
                  <Camera className="h-6 w-6 text-info" />
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
                <div className="p-3 rounded-full bg-success/10">
                  <Mic className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-medium">Teste o Microfone</h3>
                  <p className="text-sm text-muted-foreground">
                    Verifique se o áudio está funcionando
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warning/10">
                  <Video className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-medium">Jitsi Meet</h3>
                  <p className="text-sm text-muted-foreground">
                    Gratuito, sem downloads, sem conta necessária
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
