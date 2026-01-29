import { useState, useEffect, useCallback } from 'react';
import { Bell, Search, Menu, Moon, Sun, LogOut, User, Settings, HelpCircle, Plus, Command } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAll } from '@/lib/localStorage';
import { Paciente, User as UserType } from '@/types';
import { cn } from '@/lib/utils';

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
  {
    id: '1',
    type: 'info',
    title: 'Novo agendamento',
    message: 'Maria Silva agendou consulta para amanhã às 14h',
    time: 'Há 5 minutos',
    read: false,
  },
  {
    id: '2',
    type: 'success',
    title: 'Paciente na fila',
    message: 'João Santos chegou e está aguardando atendimento',
    time: 'Há 15 minutos',
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Pagamento confirmado',
    message: 'Consulta de Ana Paula foi paga via PIX',
    time: 'Há 1 hora',
    read: true,
  },
  {
    id: '4',
    type: 'warning',
    title: 'Estoque baixo',
    message: 'Dipirona 500mg está abaixo do nível mínimo',
    time: 'Há 2 horas',
    read: true,
  },
];

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  useEffect(() => {
    setPacientes(getAll<Paciente>('pacientes'));
  }, []);

  // Keyboard shortcut for search
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getNotificationColor = (type: Notification['type']) => {
    const colors = {
      info: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
    };
    return colors[type];
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Trigger */}
        <Button
          variant="outline"
          className="flex-1 max-w-md justify-start gap-2 text-muted-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Buscar pacientes, prontuários...</span>
          <span className="sm:hidden">Buscar...</span>
          <kbd className="hidden md:inline-flex pointer-events-none ml-auto h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="hidden sm:flex">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/agenda">Nova Consulta</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/pacientes">Novo Paciente</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/prescricoes">Nova Prescrição</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/exames">Solicitar Exame</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notificações
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} novas
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 py-3 cursor-pointer',
                      !notification.read && 'bg-muted/50'
                    )}
                  >
                    <div className={cn('w-2 h-2 rounded-full mt-2', getNotificationColor(notification.type))} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-primary">
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user?.nome ? getInitials(user.nome) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user?.nome?.split(' ')[0]}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.nome}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/configuracoes" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/configuracoes" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Ajuda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 max-w-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Busca Global</DialogTitle>
          </DialogHeader>
          <CommandComponent className="rounded-lg border-0">
            <CommandInput placeholder="Buscar pacientes, médicos, prontuários..." />
            <CommandList>
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              <CommandGroup heading="Pacientes">
                {pacientes.slice(0, 5).map((paciente) => (
                  <CommandItem
                    key={paciente.id}
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/pacientes');
                    }}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="text-xs">
                        {getInitials(paciente.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{paciente.nome}</p>
                      <p className="text-xs text-muted-foreground">{paciente.telefone}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Ações">
                <CommandItem onSelect={() => { setSearchOpen(false); navigate('/agenda'); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Consulta
                </CommandItem>
                <CommandItem onSelect={() => { setSearchOpen(false); navigate('/pacientes'); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Paciente
                </CommandItem>
                <CommandItem onSelect={() => { setSearchOpen(false); navigate('/prescricoes'); }}>
                  <Plus className="mr-2 h-4 w-4" />
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
