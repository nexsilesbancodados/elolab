import { useState } from 'react';
import { Save, Building, Clock, Bell, Palette, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getItem, setItem } from '@/lib/localStorage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConfiguracaoClinica {
  nomeClinica: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  horarioAbertura: string;
  horarioFechamento: string;
  duracaoConsulta: number;
  diasFuncionamento: string[];
}

interface ConfiguracaoNotificacoes {
  emailLembrete: boolean;
  smsLembrete: boolean;
  antecedenciaLembrete: number;
  notificarCancelamento: boolean;
  notificarNovoAgendamento: boolean;
}

export default function Configuracoes() {
  const { toast } = useToast();
  
  const [configClinica, setConfigClinica] = useState<ConfiguracaoClinica>(() => 
    getItem('config_clinica') || {
      nomeClinica: 'EloLab Clínica',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      horarioAbertura: '08:00',
      horarioFechamento: '18:00',
      duracaoConsulta: 30,
      diasFuncionamento: ['seg', 'ter', 'qua', 'qui', 'sex'],
    }
  );

  const [configNotificacoes, setConfigNotificacoes] = useState<ConfiguracaoNotificacoes>(() =>
    getItem('config_notificacoes') || {
      emailLembrete: true,
      smsLembrete: false,
      antecedenciaLembrete: 24,
      notificarCancelamento: true,
      notificarNovoAgendamento: true,
    }
  );

  const handleSaveClinica = () => {
    setItem('config_clinica', configClinica);
    toast({
      title: 'Configurações salvas',
      description: 'As configurações da clínica foram atualizadas.',
    });
  };

  const handleSaveNotificacoes = () => {
    setItem('config_notificacoes', configNotificacoes);
    toast({
      title: 'Configurações salvas',
      description: 'As configurações de notificações foram atualizadas.',
    });
  };

  const handleLimparDados = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('elolab_clinic_'));
    keys.forEach(key => localStorage.removeItem(key));
    toast({
      title: 'Dados limpos',
      description: 'Todos os dados foram removidos. A página será recarregada.',
    });
    setTimeout(() => window.location.reload(), 1500);
  };

  const diasSemana = [
    { value: 'seg', label: 'Segunda' },
    { value: 'ter', label: 'Terça' },
    { value: 'qua', label: 'Quarta' },
    { value: 'qui', label: 'Quinta' },
    { value: 'sex', label: 'Sexta' },
    { value: 'sab', label: 'Sábado' },
    { value: 'dom', label: 'Domingo' },
  ];

  const toggleDia = (dia: string) => {
    setConfigClinica(prev => ({
      ...prev,
      diasFuncionamento: prev.diasFuncionamento.includes(dia)
        ? prev.diasFuncionamento.filter(d => d !== dia)
        : [...prev.diasFuncionamento, dia]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="clinica" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clinica" className="gap-2">
            <Building className="h-4 w-4" />
            Clínica
          </TabsTrigger>
          <TabsTrigger value="horarios" className="gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="sistema" className="gap-2">
            <Database className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinica">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Clínica</CardTitle>
              <CardDescription>Informações básicas da clínica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da Clínica</Label>
                  <Input
                    value={configClinica.nomeClinica}
                    onChange={(e) => setConfigClinica({ ...configClinica, nomeClinica: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={configClinica.cnpj}
                    onChange={(e) => setConfigClinica({ ...configClinica, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Textarea
                    value={configClinica.endereco}
                    onChange={(e) => setConfigClinica({ ...configClinica, endereco: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={configClinica.telefone}
                    onChange={(e) => setConfigClinica({ ...configClinica, telefone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={configClinica.email}
                    onChange={(e) => setConfigClinica({ ...configClinica, email: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveClinica} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
              <CardDescription>Configure os horários da clínica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Horário de Abertura</Label>
                  <Input
                    type="time"
                    value={configClinica.horarioAbertura}
                    onChange={(e) => setConfigClinica({ ...configClinica, horarioAbertura: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário de Fechamento</Label>
                  <Input
                    type="time"
                    value={configClinica.horarioFechamento}
                    onChange={(e) => setConfigClinica({ ...configClinica, horarioFechamento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração da Consulta (min)</Label>
                  <Select
                    value={configClinica.duracaoConsulta.toString()}
                    onValueChange={(v) => setConfigClinica({ ...configClinica, duracaoConsulta: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="20">20 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dias de Funcionamento</Label>
                <div className="flex flex-wrap gap-2">
                  {diasSemana.map((dia) => (
                    <Button
                      key={dia.value}
                      variant={configClinica.diasFuncionamento.includes(dia.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDia(dia.value)}
                    >
                      {dia.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveClinica} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure as notificações automáticas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lembrete por Email</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembrete de consulta por email
                    </p>
                  </div>
                  <Switch
                    checked={configNotificacoes.emailLembrete}
                    onCheckedChange={(checked) => 
                      setConfigNotificacoes({ ...configNotificacoes, emailLembrete: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lembrete por SMS</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembrete de consulta por SMS
                    </p>
                  </div>
                  <Switch
                    checked={configNotificacoes.smsLembrete}
                    onCheckedChange={(checked) => 
                      setConfigNotificacoes({ ...configNotificacoes, smsLembrete: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificar Cancelamentos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando uma consulta for cancelada
                    </p>
                  </div>
                  <Switch
                    checked={configNotificacoes.notificarCancelamento}
                    onCheckedChange={(checked) => 
                      setConfigNotificacoes({ ...configNotificacoes, notificarCancelamento: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificar Novos Agendamentos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando houver novo agendamento
                    </p>
                  </div>
                  <Switch
                    checked={configNotificacoes.notificarNovoAgendamento}
                    onCheckedChange={(checked) => 
                      setConfigNotificacoes({ ...configNotificacoes, notificarNovoAgendamento: checked })
                    }
                  />
                </div>

                <div className="space-y-2 max-w-xs">
                  <Label>Antecedência do Lembrete (horas)</Label>
                  <Select
                    value={configNotificacoes.antecedenciaLembrete.toString()}
                    onValueChange={(v) => 
                      setConfigNotificacoes({ ...configNotificacoes, antecedenciaLembrete: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="12">12 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="48">48 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveNotificacoes} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Opções avançadas de sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Armazenamento Local</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Este sistema está usando armazenamento local (localStorage) para persistência de
                  dados. Os dados são armazenados no navegador e não são sincronizados entre
                  dispositivos.
                </p>
                <p className="text-sm text-muted-foreground">
                  Para um ambiente de produção, recomendamos migrar para o Supabase para ter
                  autenticação real, sincronização em nuvem e backup automático.
                </p>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-destructive mb-2">Zona de Perigo</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ações irreversíveis. Tenha certeza antes de prosseguir.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Limpar Todos os Dados</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá remover TODOS os dados armazenados no sistema, incluindo
                        pacientes, agendamentos, prontuários, lançamentos financeiros e usuários.
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLimparDados}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Sim, limpar tudo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
