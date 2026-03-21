import { Bell, Menu, LogOut, User, Settings, Plus, Command, CalendarPlus, UserPlus, FileText, FlaskConical } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRealtimeNotifications, type AppNotification } from '@/hooks/useRealtimeNotifications';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { profile, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useRealtimeNotifications();

  useKeyboardShortcuts();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getNotificationColor = (type: AppNotification['type']) => {
    const colors = { info: 'bg-info', success: 'bg-success', warning: 'bg-warning', error: 'bg-destructive' };
    return colors[type];
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/30 bg-background/80 backdrop-blur-xl px-3 md:px-5">
      {/* Left: Hamburger */}
      <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-lg" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Left: Search */}
      <div className="max-w-sm">
        <GlobalSearch />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Ação rápida</TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
            <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2">
              Ações Rápidas
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-lg gap-2.5 py-2.5">
              <Link to="/agenda">
                <CalendarPlus className="h-4 w-4 text-primary" />
                Nova Consulta
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg gap-2.5 py-2.5">
              <Link to="/pacientes">
                <UserPlus className="h-4 w-4 text-emerald-500" />
                Novo Paciente
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg gap-2.5 py-2.5">
              <Link to="/prescricoes">
                <FileText className="h-4 w-4 text-blue-500" />
                Nova Prescrição
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg gap-2.5 py-2.5">
              <Link to="/exames">
                <FlaskConical className="h-4 w-4 text-amber-500" />
                Solicitar Exame
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <ThemeToggle variant="dropdown" />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  <Bell className="h-[17px] w-[17px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {unreadCount > 0 ? `${unreadCount} notificações` : 'Notificações'}
              </TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl p-1.5">
            <DropdownMenuLabel className="flex items-center justify-between px-2">
              <span className="font-semibold">Notificações</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-full px-2 h-5">
                  {unreadCount}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[280px]">
              {notifications.length > 0 ? notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 py-2.5 px-2 cursor-pointer rounded-lg mb-0.5',
                    !notification.read && 'bg-accent/40'
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', getNotificationColor(notification.type))} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">{notification.time}</p>
                  </div>
                </DropdownMenuItem>
              )) : (
                <div className="py-10 text-center text-sm text-muted-foreground/50">
                  <Bell className="h-7 w-7 mx-auto mb-2 opacity-15" />
                  Sem notificações
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-border/50 mx-1" />

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-xl hover:bg-accent/60 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-9 w-9 ring-2 ring-emerald-500/30 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                  {profile?.nome ? getInitials(profile.nome) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-[13px] font-semibold leading-tight">{profile?.nome?.split(' ')[0]}</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-tight">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl p-2">
            {/* User header card */}
            <div className="flex items-center gap-3 px-2 py-3 mb-1 rounded-lg bg-accent/40">
              <Avatar className="h-10 w-10 ring-2 ring-emerald-500/30 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold">
                  {profile?.nome ? getInitials(profile.nome) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{profile?.nome}</p>
                <p className="text-[11px] text-muted-foreground truncate">{profile?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-lg gap-2.5 py-2.5 mt-1">
              <Link to="/configuracoes"><User className="h-4 w-4 text-primary" />Meu Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg gap-2.5 py-2.5">
              <Link to="/configuracoes"><Settings className="h-4 w-4 text-muted-foreground" />Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg gap-2.5 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
