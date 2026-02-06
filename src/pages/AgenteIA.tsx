import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  QrCode, 
  Smartphone, 
  Plus, 
  Trash2, 
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Users,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppAgent {
  id: string;
  nome: string;
  tipo: string;
  humor: string;
  instrucoes_personalizadas: string | null;
  ativo: boolean;
  temperatura: number;
  max_tokens: number;
  mensagem_boas_vindas: string;
  mensagem_encerramento: string;
  horario_atendimento_inicio: string;
  horario_atendimento_fim: string;
  atende_fora_horario: boolean;
  mensagem_fora_horario: string;
  created_at: string;
}

interface WhatsAppSession {
  id: string;
  instance_name: string;
  instance_id: string | null;
  status: string;
  qr_code: string | null;
  phone_number: string | null;
  agent_id: string | null;
  created_at: string;
  whatsapp_agents?: WhatsAppAgent;
}

interface WhatsAppConversation {
  id: string;
  remote_jid: string;
  status: string;
  ultima_mensagem_at: string;
  pacientes?: { nome: string } | null;
}

export default function AgenteIA() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<WhatsAppAgent | null>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newAgentForm, setNewAgentForm] = useState({
    nome: '',
    tipo: 'geral',
    humor: 'profissional',
    instrucoes_personalizadas: '',
    temperatura: 0.7,
    max_tokens: 2000,
    mensagem_boas_vindas: 'Olá! Sou o assistente virtual da clínica. Como posso ajudá-lo?',
    mensagem_encerramento: 'Obrigado pelo contato! Tenha um ótimo dia.',
    horario_atendimento_inicio: '08:00',
    horario_atendimento_fim: '18:00',
    atende_fora_horario: false,
    mensagem_fora_horario: 'Nosso atendimento funciona de segunda a sexta, das 8h às 18h. Deixe sua mensagem que retornaremos em breve.',
  });

  // Queries
  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ['whatsapp-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_agents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppAgent[];
    },
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['whatsapp-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*, whatsapp_agents(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppSession[];
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*, pacientes(nome)')
        .order('ultima_mensagem_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as WhatsAppConversation[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { count: messagesCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { count: conversationsCount } = await supabase
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { count: actionsCount } = await supabase
        .from('whatsapp_agent_actions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      return {
        messages: messagesCount || 0,
        conversations: conversationsCount || 0,
        actions: actionsCount || 0,
      };
    },
  });

  // Mutations
  const createAgentMutation = useMutation({
    mutationFn: async (agent: typeof newAgentForm) => {
      const { data, error } = await supabase
        .from('whatsapp_agents')
        .insert([agent])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-agents'] });
      setIsCreatingAgent(false);
      setNewAgentForm({
        nome: '',
        tipo: 'geral',
        humor: 'profissional',
        instrucoes_personalizadas: '',
        temperatura: 0.7,
        max_tokens: 2000,
        mensagem_boas_vindas: 'Olá! Sou o assistente virtual da clínica. Como posso ajudá-lo?',
        mensagem_encerramento: 'Obrigado pelo contato! Tenha um ótimo dia.',
        horario_atendimento_inicio: '08:00',
        horario_atendimento_fim: '18:00',
        atende_fora_horario: false,
        mensagem_fora_horario: 'Nosso atendimento funciona de segunda a sexta, das 8h às 18h. Deixe sua mensagem que retornaremos em breve.',
      });
      toast.success('Agente criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar agente: ' + error.message);
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: async (agent: Partial<WhatsAppAgent> & { id: string }) => {
      const { id, ...updates } = agent;
      const { error } = await supabase
        .from('whatsapp_agents')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-agents'] });
      toast.success('Agente atualizado!');
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_agents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-agents'] });
      setSelectedAgent(null);
      toast.success('Agente excluído!');
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (instanceName: string) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'create_instance', instance_name: instanceName },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      setIsCreatingSession(false);
      setNewInstanceName('');
      toast.success('Sessão criada! Escaneie o QR Code.');
    },
    onError: (error) => {
      toast.error('Erro ao criar sessão: ' + error.message);
    },
  });

  const refreshQRMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('Sessão não encontrada');
      
      const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'get_qr_code', instance_name: session.instance_name },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      toast.success('QR Code atualizado!');
    },
  });

  const checkStatusMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'check_status', session_id: sessionId },
      });
      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'delete_instance', session_id: sessionId },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      toast.success('Sessão removida!');
    },
  });

  const linkAgentToSessionMutation = useMutation({
    mutationFn: async ({ sessionId, agentId }: { sessionId: string; agentId: string | null }) => {
      const { error } = await supabase
        .from('whatsapp_sessions')
        .update({ agent_id: agentId })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      toast.success('Agente vinculado!');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><Wifi className="w-3 h-3 mr-1" /> Conectado</Badge>;
      case 'qr_code':
        return <Badge variant="secondary"><QrCode className="w-3 h-3 mr-1" /> Aguardando QR</Badge>;
      case 'connecting':
        return <Badge variant="outline"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Conectando</Badge>;
      default:
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" /> Desconectado</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'geral':
        return <Badge variant="outline">Atendimento Geral</Badge>;
      case 'agendamento':
        return <Badge variant="secondary">Agendamento</Badge>;
      case 'triagem':
        return <Badge>Triagem</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              Agente de IA - WhatsApp
            </h1>
            <p className="text-muted-foreground">
              Configure e gerencie o atendimento automatizado via WhatsApp
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                  <p className="text-2xl font-bold">
                    {sessions.filter(s => s.status === 'connected').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mensagens Hoje</p>
                  <p className="text-2xl font-bold">{stats?.messages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversas Hoje</p>
                  <p className="text-2xl font-bold">{stats?.conversations || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ações do Agente</p>
                  <p className="text-2xl font-bold">{stats?.actions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Sessões WhatsApp
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Configurar Agentes
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversas
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Sessões de WhatsApp</h2>
              <Dialog open={isCreatingSession} onOpenChange={setIsCreatingSession}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Sessão
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Sessão</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Nome da Instância</Label>
                      <Input
                        placeholder="Ex: clinica-principal"
                        value={newInstanceName}
                        onChange={(e) => setNewInstanceName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use apenas letras, números e hífens
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => createSessionMutation.mutate(newInstanceName)}
                      disabled={!newInstanceName || createSessionMutation.isPending}
                    >
                      {createSessionMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4 mr-2" />
                      )}
                      Gerar QR Code
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loadingSessions ? (
              <div className="text-center py-8">Carregando sessões...</div>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma sessão configurada</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie uma sessão para conectar o WhatsApp
                  </p>
                  <Button onClick={() => setIsCreatingSession(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Sessão
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => (
                  <Card key={session.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{session.instance_name}</CardTitle>
                        {getStatusBadge(session.status)}
                      </div>
                      {session.phone_number && (
                        <CardDescription>{session.phone_number}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {session.status === 'qr_code' && session.qr_code && (
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src={session.qr_code.startsWith('data:') ? session.qr_code : `data:image/png;base64,${session.qr_code}`}
                            alt="QR Code"
                            className="w-48 h-48 border rounded"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refreshQRMutation.mutate(session.id)}
                            disabled={refreshQRMutation.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshQRMutation.isPending ? 'animate-spin' : ''}`} />
                            Atualizar QR
                          </Button>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Agente Vinculado</Label>
                        <Select
                          value={session.agent_id || 'none'}
                          onValueChange={(value) => 
                            linkAgentToSessionMutation.mutate({
                              sessionId: session.id,
                              agentId: value === 'none' ? null : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um agente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum agente</SelectItem>
                            {agents.filter(a => a.ativo).map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.nome} ({agent.tipo})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => checkStatusMutation.mutate(session.id)}
                          disabled={checkStatusMutation.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${checkStatusMutation.isPending ? 'animate-spin' : ''}`} />
                          Verificar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Deseja realmente remover esta sessão?')) {
                              deleteSessionMutation.mutate(session.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Agentes de IA</h2>
              <Button onClick={() => setIsCreatingAgent(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Agente
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Agentes */}
              <div className="space-y-3">
                {loadingAgents ? (
                  <div className="text-center py-8">Carregando agentes...</div>
                ) : agents.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum agente criado</p>
                    </CardContent>
                  </Card>
                ) : (
                  agents.map((agent) => (
                    <Card
                      key={agent.id}
                      className={`cursor-pointer transition-colors ${
                        selectedAgent?.id === agent.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{agent.nome}</h3>
                            <div className="flex gap-2 mt-1">
                              {getTipoBadge(agent.tipo)}
                              {!agent.ativo && <Badge variant="destructive">Inativo</Badge>}
                            </div>
                          </div>
                          <Settings className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Editor de Agente */}
              <div className="lg:col-span-2">
                {isCreatingAgent ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Criar Novo Agente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nome do Agente</Label>
                          <Input
                            value={newAgentForm.nome}
                            onChange={(e) => setNewAgentForm({ ...newAgentForm, nome: e.target.value })}
                            placeholder="Ex: Assistente da Clínica"
                          />
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <Select
                            value={newAgentForm.tipo}
                            onValueChange={(value) => setNewAgentForm({ ...newAgentForm, tipo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="geral">Atendimento Geral</SelectItem>
                              <SelectItem value="agendamento">Agendamento</SelectItem>
                              <SelectItem value="triagem">Triagem Inicial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Humor / Tom</Label>
                        <Select
                          value={newAgentForm.humor}
                          onValueChange={(value) => setNewAgentForm({ ...newAgentForm, humor: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="profissional">Formal / Profissional</SelectItem>
                            <SelectItem value="amigavel">Amigável / Acolhedor</SelectItem>
                            <SelectItem value="objetivo">Objetivo / Direto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Instruções Personalizadas</Label>
                        <Textarea
                          value={newAgentForm.instrucoes_personalizadas}
                          onChange={(e) => setNewAgentForm({ ...newAgentForm, instrucoes_personalizadas: e.target.value })}
                          placeholder="Instruções adicionais para o agente..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Mensagem de Boas-vindas</Label>
                        <Textarea
                          value={newAgentForm.mensagem_boas_vindas}
                          onChange={(e) => setNewAgentForm({ ...newAgentForm, mensagem_boas_vindas: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Horário Início</Label>
                          <Input
                            type="time"
                            value={newAgentForm.horario_atendimento_inicio}
                            onChange={(e) => setNewAgentForm({ ...newAgentForm, horario_atendimento_inicio: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Horário Fim</Label>
                          <Input
                            type="time"
                            value={newAgentForm.horario_atendimento_fim}
                            onChange={(e) => setNewAgentForm({ ...newAgentForm, horario_atendimento_fim: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newAgentForm.atende_fora_horario}
                          onCheckedChange={(checked) => setNewAgentForm({ ...newAgentForm, atende_fora_horario: checked })}
                        />
                        <Label>Atender fora do horário</Label>
                      </div>

                      <div>
                        <Label>Temperatura da IA: {newAgentForm.temperatura}</Label>
                        <Slider
                          value={[newAgentForm.temperatura]}
                          onValueChange={([value]) => setNewAgentForm({ ...newAgentForm, temperatura: value })}
                          min={0}
                          max={1}
                          step={0.1}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Valores mais baixos = respostas mais precisas. Valores mais altos = respostas mais criativas.
                        </p>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          className="flex-1"
                          onClick={() => createAgentMutation.mutate(newAgentForm)}
                          disabled={!newAgentForm.nome || createAgentMutation.isPending}
                        >
                          {createAgentMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Criar Agente
                        </Button>
                        <Button variant="outline" onClick={() => setIsCreatingAgent(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : selectedAgent ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Editar: {selectedAgent.nome}</CardTitle>
                        <div className="flex gap-2">
                          <Switch
                            checked={selectedAgent.ativo}
                            onCheckedChange={(checked) => {
                              updateAgentMutation.mutate({ id: selectedAgent.id, ativo: checked });
                              setSelectedAgent({ ...selectedAgent, ativo: checked });
                            }}
                          />
                          <Label>Ativo</Label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nome do Agente</Label>
                          <Input
                            value={selectedAgent.nome}
                            onChange={(e) => setSelectedAgent({ ...selectedAgent, nome: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <Select
                            value={selectedAgent.tipo}
                            onValueChange={(value) => setSelectedAgent({ ...selectedAgent, tipo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="geral">Atendimento Geral</SelectItem>
                              <SelectItem value="agendamento">Agendamento</SelectItem>
                              <SelectItem value="triagem">Triagem Inicial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Humor / Tom</Label>
                        <Select
                          value={selectedAgent.humor}
                          onValueChange={(value) => setSelectedAgent({ ...selectedAgent, humor: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="profissional">Formal / Profissional</SelectItem>
                            <SelectItem value="amigavel">Amigável / Acolhedor</SelectItem>
                            <SelectItem value="objetivo">Objetivo / Direto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Instruções Personalizadas</Label>
                        <Textarea
                          value={selectedAgent.instrucoes_personalizadas || ''}
                          onChange={(e) => setSelectedAgent({ ...selectedAgent, instrucoes_personalizadas: e.target.value })}
                          placeholder="Instruções adicionais para o agente..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Mensagem de Boas-vindas</Label>
                        <Textarea
                          value={selectedAgent.mensagem_boas_vindas}
                          onChange={(e) => setSelectedAgent({ ...selectedAgent, mensagem_boas_vindas: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Mensagem Fora do Horário</Label>
                        <Textarea
                          value={selectedAgent.mensagem_fora_horario}
                          onChange={(e) => setSelectedAgent({ ...selectedAgent, mensagem_fora_horario: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Horário Início</Label>
                          <Input
                            type="time"
                            value={selectedAgent.horario_atendimento_inicio}
                            onChange={(e) => setSelectedAgent({ ...selectedAgent, horario_atendimento_inicio: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Horário Fim</Label>
                          <Input
                            type="time"
                            value={selectedAgent.horario_atendimento_fim}
                            onChange={(e) => setSelectedAgent({ ...selectedAgent, horario_atendimento_fim: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedAgent.atende_fora_horario}
                          onCheckedChange={(checked) => setSelectedAgent({ ...selectedAgent, atende_fora_horario: checked })}
                        />
                        <Label>Atender fora do horário</Label>
                      </div>

                      <div>
                        <Label>Temperatura da IA: {selectedAgent.temperatura}</Label>
                        <Slider
                          value={[Number(selectedAgent.temperatura)]}
                          onValueChange={([value]) => setSelectedAgent({ ...selectedAgent, temperatura: value })}
                          min={0}
                          max={1}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          className="flex-1"
                          onClick={() => updateAgentMutation.mutate(selectedAgent)}
                          disabled={updateAgentMutation.isPending}
                        >
                          Salvar Alterações
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Deseja realmente excluir este agente?')) {
                              deleteAgentMutation.mutate(selectedAgent.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Selecione um agente para editar ou crie um novo
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="space-y-4">
            <h2 className="text-xl font-semibold">Conversas Recentes</h2>
            
            {conversations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma conversa ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Card key={conv.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <MessageSquare className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {conv.pacientes?.nome || conv.remote_jid.replace('@s.whatsapp.net', '')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(conv.ultima_mensagem_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {conv.status === 'aguardando_humano' && (
                            <Badge variant="destructive">Aguardando Humano</Badge>
                          )}
                          {conv.status === 'ativo' && (
                            <Badge variant="secondary">Ativo</Badge>
                          )}
                          {conv.status === 'encerrado' && (
                            <Badge variant="outline">Encerrado</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
