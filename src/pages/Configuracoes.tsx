import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Save, Building, Clock, Bell, Download, History,
  Shield, Palette, Globe, Mail, Smartphone, MessageSquare, Database,
  Key, RefreshCw, CloudOff, Cloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { BackupRestore } from '@/components/BackupRestore';
import { AuditLog } from '@/components/AuditLog';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface ConfiguracaoClinica {
  nomeClinica: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  website: string;
  horarioAbertura: string;
  horarioFechamento: string;
  duracaoConsulta: number;
  intervaloConsultas: number;
  diasFuncionamento: string[];
}

interface ConfiguracaoNotificacoes {
  emailLembrete: boolean;
  smsLembrete: boolean;
  whatsappLembrete: boolean;
  antecedenciaLembrete: number;
  notificarCancelamento: boolean;
  notificarNovoAgendamento: boolean;
  notificarResultadoExame: boolean;
  notificarAniversario: boolean;
}

const DEFAULT_CLINICA: ConfiguracaoClinica = {
  nomeClinica: 'EloLab Clínica',
  cnpj: '',
  endereco: '',
  telefone: '',
  email: '',
  website: '',
  horarioAbertura: '08:00',
  horarioFechamento: '18:00',
  duracaoConsulta: 30,
  intervaloConsultas: 5,
  diasFuncionamento: ['seg', 'ter', 'qua', 'qui', 'sex'],
};

const DEFAULT_NOTIFICACOES: ConfiguracaoNotificacoes = {
  emailLembrete: true,
  smsLembrete: false,
  whatsappLembrete: false,
  antecedenciaLembrete: 24,
  notificarCancelamento: true,
  notificarNovoAgendamento: true,
  notificarResultadoExame: true,
  notificarAniversario: false,
};

function SettingRow({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function Configuracoes() {
  const { theme, setTheme } = useTheme();
  const { user } = useSupabaseAuth();
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [configClinica, setConfigClinica] = useState<ConfiguracaoClinica>(DEFAULT_CLINICA);
  const [configNotificacoes, setConfigNotificacoes] = useState<ConfiguracaoNotificacoes>(DEFAULT_NOTIFICACOES);
  const [savingClinica, setSavingClinica] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Load configs from Supabase
  const loadConfigs = useCallback(async () => {
    if (!user?.id) return;
    setLoadingConfig(true);
    try {
      const { data } = await supabase
        .from('configuracoes_clinica')
        .select('chave, valor')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        setIsCloudSynced(true);
        const clinicaRow = data.find(d => d.chave === 'config_clinica');
        const notifRow = data.find(d => d.chave === 'config_notificacoes');
        if (clinicaRow) setConfigClinica({ ...DEFAULT_CLINICA, ...(clinicaRow.valor as any) });
        if (notifRow) setConfigNotificacoes({ ...DEFAULT_NOTIFICACOES, ...(notifRow.valor as any) });
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading configs:', error);
    } finally {
      setLoadingConfig(false);
    }
  }, [user?.id]);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  const saveToSupabase = async (chave: string, valor: any) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('configuracoes_clinica')
      .upsert(
        { user_id: user.id, chave, valor, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,chave' }
      );

    if (error) throw error;
    setIsCloudSynced(true);
  };

  const handleSaveClinica = async () => {
    setSavingClinica(true);
    try {
      await saveToSupabase('config_clinica', configClinica);
      toast.success('Configurações da clínica salvas na nuvem!');
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSavingClinica(false);
    }
  };

  const handleSaveNotificacoes = async () => {
    setSavingNotif(true);
    try {
      await saveToSupabase('config_notificacoes', configNotificacoes);
      toast.success('Configurações de notificações salvas na nuvem!');
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSavingNotif(false);
    }
  };

  const diasSemana = [
    { value: 'seg', label: 'Seg' }, { value: 'ter', label: 'Ter' },
    { value: 'qua', label: 'Qua' }, { value: 'qui', label: 'Qui' },
    { value: 'sex', label: 'Sex' }, { value: 'sab', label: 'Sáb' },
    { value: 'dom', label: 'Dom' },
  ];

  const toggleDia = (dia: string) => {
    setConfigClinica(prev => ({
      ...prev,
      diasFuncionamento: prev.diasFuncionamento.includes(dia)
        ? prev.diasFuncionamento.filter(d => d !== dia)
        : [...prev.diasFuncionamento, dia]
    }));
  };

  const tabItems = [
    { value: 'clinica', icon: Building, label: 'Clínica' },
    { value: 'horarios', icon: Clock, label: 'Horários' },
    { value: 'notificacoes', icon: Bell, label: 'Notificações' },
    { value: 'aparencia', icon: Palette, label: 'Aparência' },
    { value: 'seguranca', icon: Shield, label: 'Segurança' },
    { value: 'backup', icon: Download, label: 'Backup' },
    { value: 'historico', icon: History, label: 'Auditoria' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie todas as configurações do sistema</p>
        </div>
        <Badge variant={isCloudSynced ? 'default' : 'secondary'} className="gap-1.5">
          {isCloudSynced ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
          {isCloudSynced ? 'Sincronizado' : 'Local'}
        </Badge>
      </div>

      <Tabs defaultValue="clinica" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {tabItems.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Clínica ─── */}
        <TabsContent value="clinica">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Dados da Clínica
                </CardTitle>
                <CardDescription>Informações cadastrais da sua clínica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome da Clínica</Label>
                    <Input value={configClinica.nomeClinica} onChange={(e) => setConfigClinica({ ...configClinica, nomeClinica: e.target.value })} placeholder="Nome da clínica" />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input value={configClinica.cnpj} onChange={(e) => setConfigClinica({ ...configClinica, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Endereço Completo</Label>
                    <Textarea value={configClinica.endereco} onChange={(e) => setConfigClinica({ ...configClinica, endereco: e.target.value })} rows={2} placeholder="Rua, número, bairro, cidade - UF" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={configClinica.telefone} onChange={(e) => setConfigClinica({ ...configClinica, telefone: e.target.value })} placeholder="(00) 0000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={configClinica.email} onChange={(e) => setConfigClinica({ ...configClinica, email: e.target.value })} placeholder="contato@clinica.com" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Website</Label>
                    <Input value={configClinica.website} onChange={(e) => setConfigClinica({ ...configClinica, website: e.target.value })} placeholder="https://www.clinica.com.br" />
                  </div>
                </div>
                <Separator />
                <Button onClick={handleSaveClinica} disabled={savingClinica} className="gap-2">
                  {savingClinica ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar na Nuvem
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Horários ─── */}
        <TabsContent value="horarios">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Horários de Funcionamento</CardTitle>
                <CardDescription>Configure os horários e dias de atendimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Abertura</Label>
                    <Input type="time" value={configClinica.horarioAbertura} onChange={(e) => setConfigClinica({ ...configClinica, horarioAbertura: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fechamento</Label>
                    <Input type="time" value={configClinica.horarioFechamento} onChange={(e) => setConfigClinica({ ...configClinica, horarioFechamento: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duração Consulta</Label>
                    <Select value={configClinica.duracaoConsulta.toString()} onValueChange={(v) => setConfigClinica({ ...configClinica, duracaoConsulta: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="20">20 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Intervalo entre Consultas</Label>
                    <Select value={configClinica.intervaloConsultas.toString()} onValueChange={(v) => setConfigClinica({ ...configClinica, intervaloConsultas: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sem intervalo</SelectItem>
                        <SelectItem value="5">5 minutos</SelectItem>
                        <SelectItem value="10">10 minutos</SelectItem>
                        <SelectItem value="15">15 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dias de Funcionamento</Label>
                  <div className="flex flex-wrap gap-2">
                    {diasSemana.map((dia) => (
                      <Button key={dia.value} variant={configClinica.diasFuncionamento.includes(dia.value) ? 'default' : 'outline'} size="sm" onClick={() => toggleDia(dia.value)} className="min-w-[48px]">
                        {dia.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <Button onClick={handleSaveClinica} disabled={savingClinica} className="gap-2">
                  {savingClinica ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar na Nuvem
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Notificações ─── */}
        <TabsContent value="notificacoes">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Notificações</CardTitle>
                <CardDescription>Configure os canais e tipos de notificações automáticas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  <SettingRow icon={Mail} title="Lembrete por Email" description="Enviar lembrete de consulta por email para o paciente">
                    <Switch checked={configNotificacoes.emailLembrete} onCheckedChange={(checked) => setConfigNotificacoes({ ...configNotificacoes, emailLembrete: checked })} />
                  </SettingRow>
                  <SettingRow icon={Smartphone} title="Lembrete por SMS" description="Enviar lembrete de consulta por SMS">
                    <Switch checked={configNotificacoes.smsLembrete} onCheckedChange={(checked) => setConfigNotificacoes({ ...configNotificacoes, smsLembrete: checked })} />
                  </SettingRow>
                  <SettingRow icon={MessageSquare} title="Lembrete por WhatsApp" description="Enviar lembrete via WhatsApp (requer Evolution API configurada)">
                    <Switch checked={configNotificacoes.whatsappLembrete} onCheckedChange={(checked) => setConfigNotificacoes({ ...configNotificacoes, whatsappLembrete: checked })} />
                  </SettingRow>
                  <SettingRow icon={Bell} title="Notificar Cancelamentos" description="Notificar equipe quando uma consulta for cancelada">
                    <Switch checked={configNotificacoes.notificarCancelamento} onCheckedChange={(checked) => setConfigNotificacoes({ ...configNotificacoes, notificarCancelamento: checked })} />
                  </SettingRow>
                  <SettingRow icon={Bell} title="Novos Agendamentos" description="Notificar equipe sobre novos agendamentos">
                    <Switch checked={configNotificacoes.notificarNovoAgendamento} onCheckedChange={(checked) => setConfigNotificacoes({ ...configNotificacoes, notificarNovoAgendamento: checked })} />
                  </SettingRow>
                  <SettingRow icon={Database} title="Resultado de Exames" description="Notificar paciente quando resultado de exame estiver disponível">
                    <Switch checked={configNotificacoes.notificarResultadoExame} onCheckedChange={(checked) => setConfigNotificacoes({ ...configNotificacoes, notificarResultadoExame: checked })} />
                  </SettingRow>
                  <SettingRow icon={Bell} title="Aniversário do Paciente" description="Enviar felicitação automática no aniversário">
                    <Switch checked={configNotificacoes.notificarAniversario} onCheckedChange={(checked) => setConfigNotificacoes({ ...configNotificacoes, notificarAniversario: checked })} />
                  </SettingRow>
                </div>
                <div className="mt-6 space-y-2 max-w-xs">
                  <Label>Antecedência do Lembrete</Label>
                  <Select value={configNotificacoes.antecedenciaLembrete.toString()} onValueChange={(v) => setConfigNotificacoes({ ...configNotificacoes, antecedenciaLembrete: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora antes</SelectItem>
                      <SelectItem value="2">2 horas antes</SelectItem>
                      <SelectItem value="12">12 horas antes</SelectItem>
                      <SelectItem value="24">24 horas antes</SelectItem>
                      <SelectItem value="48">48 horas antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="my-6" />
                <Button onClick={handleSaveNotificacoes} disabled={savingNotif} className="gap-2">
                  {savingNotif ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar na Nuvem
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="aparencia">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />Aparência</CardTitle>
                <CardDescription>Personalize a aparência do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Tema</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { value: 'light' as const, label: 'Claro', desc: 'Fundo branco e cores suaves' },
                      { value: 'dark' as const, label: 'Escuro', desc: 'Fundo escuro, ideal para baixa luz' },
                    ] satisfies { value: 'light' | 'dark'; label: string; desc: string }[]).map(opt => (
                      <button key={opt.value} onClick={() => setTheme(opt.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${theme === opt.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'}`}>
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="p-4 rounded-xl border bg-muted/30">
                  <h4 className="font-medium text-sm mb-2">Prévia das Cores</h4>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { name: 'Primary', className: 'bg-primary' },
                      { name: 'Secondary', className: 'bg-secondary border' },
                      { name: 'Accent', className: 'bg-accent' },
                      { name: 'Muted', className: 'bg-muted' },
                      { name: 'Destructive', className: 'bg-destructive' },
                    ].map(color => (
                      <div key={color.name} className="text-center">
                        <div className={`w-10 h-10 rounded-lg ${color.className}`} />
                        <p className="text-[10px] text-muted-foreground mt-1">{color.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Segurança ─── */}
        <TabsContent value="seguranca">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Segurança e Privacidade</CardTitle>
                <CardDescription>Configurações de segurança do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  <SettingRow icon={Key} title="Sessão Automática" description="Desconectar automaticamente após período de inatividade">
                    <Select defaultValue={localStorage.getItem('session_timeout_min') || '30'} onValueChange={(val) => { localStorage.setItem('session_timeout_min', val); toast.success(`Sessão expira após ${val} minutos de inatividade.`); }}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                  <SettingRow icon={Shield} title="Mascarar CPF" description="Exibir CPF mascarado na listagem de pacientes">
                    <Switch defaultChecked />
                  </SettingRow>
                  <SettingRow icon={Shield} title="Log de Auditoria" description="Registrar todas as ações dos usuários no sistema">
                    <Switch defaultChecked />
                  </SettingRow>
                  <SettingRow icon={Globe} title="Conformidade LGPD" description="Exigir consentimento do paciente para coleta de dados">
                    <Switch defaultChecked />
                  </SettingRow>
                </div>
                <div className="mt-6 p-4 rounded-xl border bg-primary/5">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Proteção de Dados</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        O sistema utiliza Row Level Security (RLS) no banco de dados, garantindo que cada usuário
                        acesse apenas os dados autorizados para seu papel. Todas as comunicações são criptografadas via HTTPS.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="backup">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <BackupRestore />
          </motion.div>
        </TabsContent>

        <TabsContent value="historico">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <AuditLog />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
