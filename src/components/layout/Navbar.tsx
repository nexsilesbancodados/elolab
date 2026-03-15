import { Bell, Menu, LogOut, User, Settings, Plus } from 'lucide-react';
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 bg-background/70 backdrop-blur-2xl px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Global Search */}
      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações Rápidas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/agenda" className="flex items-center gap-2.5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Nova Consulta
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/pacientes" className="flex items-center gap-2.5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-success" />
                Novo Paciente
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/prescricoes" className="flex items-center gap-2.5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-info" />
                Nova Prescrição
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/exames" className="flex items-center gap-2.5 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-warning" />
                Solicitar Exame
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle variant="dropdown" />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60">
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="font-semibold">Notificações</span>
              {unreadCount > 0 && <Badge variant="secondary" className="text-xs rounded-lg">{unreadCount} novas</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {notifications.length > 0 ? notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn('flex items-start gap-3 py-3 cursor-pointer rounded-lg', !notification.read && 'bg-accent/30')}
                >
                  <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', getNotificationColor(notification.type))} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{notification.time}</p>
                  </div>
                </DropdownMenuItem>
              )) : (
                <div className="py-10 text-center text-sm text-muted-foreground/60">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  Nenhuma notificação
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-border/50 mx-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 px-2 hover:bg-accent/60 h-auto py-1.5 rounded-xl">
              <Avatar className="h-8 w-8 ring-2 ring-primary/15 transition-all hover:ring-primary/30">
                <AvatarFallback className="bg-gradient-to-br from-primary to-brand-glow text-primary-foreground text-xs font-bold">
                  {profile?.nome ? getInitials(profile.nome) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold leading-none">{profile?.nome?.split(' ')[0]}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Online</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel className="pb-3">
              <p className="font-semibold truncate">{profile?.nome}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{profile?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-lg">
              <Link to="/configuracoes" className="flex items-center gap-2.5"><User className="h-4 w-4" />Meu Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg">
              <Link to="/configuracoes" className="flex items-center gap-2.5"><Settings className="h-4 w-4" />Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2.5 text-destructive focus:text-destructive rounded-lg">
              <LogOut className="h-4 w-4" />Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
