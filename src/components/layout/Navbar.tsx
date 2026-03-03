import { useState, useEffect } from 'react';
import { Bell, Search, Menu, LogOut, User, Settings, HelpCircle, Plus, Command, Calendar, DollarSign, Stethoscope, FileText, FlaskConical, Package, ListTodo } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command as CommandComponent,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePacientes, useMedicos, useAgendamentos } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'info', title: 'Novo agendamento', message: 'Maria Silva agendou consulta para amanhã às 14h', time: 'Há 5 minutos', read: false },
  { id: '2', type: 'success', title: 'Paciente na fila', message: 'João Santos chegou e está aguardando atendimento', time: 'Há 15 minutos', read: false },
  { id: '3', type: 'success', title: 'Pagamento confirmado', message: 'Consulta de Ana Paula foi paga via PIX', time: 'Há 1 hora', read: true },
  { id: '4', type: 'warning', title: 'Estoque baixo', message: 'Dipirona 500mg está abaixo do nível mínimo', time: 'Há 2 horas', read: true },
];

const quickNavigation = [
  { id: 'dashboard', title: 'Dashboard', icon: Command, url: '/dashboard' },
  { id: 'pacientes', title: 'Pacientes', icon: Users, url: '/pacientes' },
  { id: 'agenda', title: 'Agenda', icon: Calendar, url: '/agenda' },
  { id: 'financeiro', title: 'Financeiro', icon: DollarSign, url: '/financeiro' },
  { id: 'prontuarios', title: 'Prontuários', icon: FileText, url: '/prontuarios' },
  { id: 'exames', title: 'Exames', icon: FlaskConical, url: '/exames' },
  { id: 'laboratorio', title: 'Laboratório', icon: FlaskConical, url: '/laboratorio' },
  { id: 'estoque', title: 'Estoque', icon: Package, url: '/estoque' },
  { id: 'tarefas', title: 'Tarefas', icon: ListTodo, url: '/tarefas' },
  { id: 'medicos', title: 'Médicos', icon: Stethoscope, url: '/medicos' },
  { id: 'configuracoes', title: 'Configurações', icon: Settings, url: '/configuracoes' },
];

export function Navbar({ onMenuClick }: NavbarProps) {
  const { profile, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: pacientes = [] } = usePacientes();
  const { data: medicos = [] } = useMedicos();
  const { data: agendamentos = [] } = useAgendamentos();
  const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  
  useKeyboardShortcuts();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getNotificationColor = (type: Notification['type']) => {
    const colors = { info: 'bg-info', success: 'bg-success', warning: 'bg-warning', error: 'bg-destructive' };
    return colors[type];
  };

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const agendamentosHoje = agendamentos.filter(a => a.data === hoje);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-6">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Trigger */}
        <Button
          variant="outline"
          className="flex-1 max-w-md justify-start gap-2 text-muted-foreground bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Buscar pacientes, médicos, prontuários...</span>
          <span className="sm:hidden">Buscar...</span>
          <kbd className="hidden md:inline-flex pointer-events-none ml-auto h-5 select-none items-center gap-1 rounded-md border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        {/* Right section */}
        <div className="flex items-center gap-1.5">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="hidden sm:flex h-9 w-9 border-border/50 bg-muted/30 hover:bg-primary hover:text-primary-foreground hover:border-primary">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Ações Rápidas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/agenda" className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Nova Consulta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/pacientes" className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  Novo Paciente
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/prescricoes" className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-info" />
                  Nova Prescrição
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/exames" className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  Solicitar Exame
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <KeyboardShortcutsHelp />
          <ThemeToggle variant="dropdown" />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-muted/50">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="font-semibold">Notificações</span>
                {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount} novas</Badge>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className={cn('flex items-start gap-3 py-3 cursor-pointer', !notification.read && 'bg-muted/50')}>
                    <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', getNotificationColor(notification.type))} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{notification.time}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-primary text-sm font-medium">Ver todas as notificações</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2.5 px-2 hover:bg-muted/50 h-auto py-1.5">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-semibold">
                    {profile?.nome ? getInitials(profile.nome) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-tight">{profile?.nome?.split(' ')[0]}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{profile?.role || 'Sem função'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                      {profile?.nome ? getInitials(profile.nome) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{profile?.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/configuracoes" className="flex items-center gap-2"><User className="h-4 w-4" />Meu Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/configuracoes" className="flex items-center gap-2"><Settings className="h-4 w-4" />Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2"><HelpCircle className="h-4 w-4" />Ajuda</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Enhanced Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 max-w-xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Busca Global</DialogTitle>
          </DialogHeader>
          <CommandComponent className="rounded-xl border-0">
            <CommandInput placeholder="Buscar pacientes, médicos, agendamentos..." className="h-12" />
            <CommandList className="max-h-[400px]">
              <CommandEmpty className="py-8 text-center text-muted-foreground">
                Nenhum resultado encontrado.
              </CommandEmpty>

              {/* Patients */}
              <CommandGroup heading="Pacientes">
                {pacientes.slice(0, 5).map((paciente) => (
                  <CommandItem
                    key={paciente.id}
                    value={`paciente ${paciente.nome} ${paciente.cpf || ''} ${paciente.telefone || ''}`}
                    onSelect={() => { setSearchOpen(false); navigate('/pacientes'); }}
                    className="py-3"
                  >
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(paciente.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{paciente.nome}</p>
                      <p className="text-xs text-muted-foreground">{paciente.telefone || paciente.cpf || 'Sem telefone'}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              {/* Doctors */}
              <CommandGroup heading="Médicos">
                {medicos.slice(0, 5).map((medico) => (
                  <CommandItem
                    key={medico.id}
                    value={`medico ${medico.crm} ${medico.especialidade || ''}`}
                    onSelect={() => { setSearchOpen(false); navigate('/medicos'); }}
                    className="py-3"
                  >
                    <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center mr-3">
                      <Stethoscope className="h-4 w-4 text-info" />
                    </div>
                    <div>
                      <p className="font-medium">CRM: {medico.crm}</p>
                      <p className="text-xs text-muted-foreground">{medico.especialidade || 'Sem especialidade'}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              {/* Today's Appointments */}
              {agendamentosHoje.length > 0 && (
                <>
                  <CommandGroup heading="Agendamentos de Hoje">
                    {agendamentosHoje.slice(0, 5).map((ag) => (
                      <CommandItem
                        key={ag.id}
                        value={`agendamento ${ag.hora_inicio} ${ag.tipo || ''} ${ag.observacoes || ''}`}
                        onSelect={() => { setSearchOpen(false); navigate('/agenda'); }}
                        className="py-3"
                      >
                        <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mr-3">
                          <Calendar className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">{ag.hora_inicio} - {ag.tipo || 'Consulta'}</p>
                          <p className="text-xs text-muted-foreground">{ag.observacoes || 'Agendamento'}</p>
                        </div>
                        <Badge variant={ag.status === 'confirmado' ? 'default' : 'secondary'} className="ml-auto text-[10px]">
                          {ag.status}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Quick Navigation */}
              <CommandGroup heading="Navegação Rápida">
                {quickNavigation.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`ir para ${item.title}`}
                    onSelect={() => { setSearchOpen(false); navigate(item.url); }}
                    className="py-3"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center mr-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    Ir para {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              {/* Quick Actions */}
              <CommandGroup heading="Ações Rápidas">
                <CommandItem onSelect={() => { setSearchOpen(false); navigate('/agenda'); }} className="py-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  Nova Consulta
                </CommandItem>
                <CommandItem onSelect={() => { setSearchOpen(false); navigate('/pacientes'); }} className="py-3">
                  <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mr-3">
                    <Plus className="h-4 w-4 text-success" />
                  </div>
                  Novo Paciente
                </CommandItem>
                <CommandItem onSelect={() => { setSearchOpen(false); navigate('/prescricoes'); }} className="py-3">
                  <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center mr-3">
                    <Plus className="h-4 w-4 text-info" />
                  </div>
                  Nova Prescrição
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandComponent>
        </DialogContent>
      </Dialog>
    </>
  );
}
