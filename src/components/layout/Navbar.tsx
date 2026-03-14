import { useState } from 'react';
import { Bell, Menu, LogOut, User, Settings, HelpCircle, Plus, Calendar, DollarSign, Stethoscope, FileText, FlaskConical, Package, ListTodo } from 'lucide-react';
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
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Global Search (⌘K) */}
      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>

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
              {notifications.length > 0 ? notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn('flex items-start gap-3 py-3 cursor-pointer', !notification.read && 'bg-muted/50')}
                >
                  <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', getNotificationColor(notification.type))} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{notification.time}</p>
                  </div>
                </DropdownMenuItem>
              )) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </div>
              )}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-primary text-sm font-medium">
              Ver todas as notificações
            </DropdownMenuItem>
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
  );
}
