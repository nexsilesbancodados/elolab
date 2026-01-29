import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Monitor,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Stethoscope,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'medico', 'recepcao', 'enfermagem', 'financeiro'],
  },
  {
    label: 'Pacientes',
    href: '/pacientes',
    icon: Users,
    roles: ['admin', 'medico', 'recepcao', 'enfermagem'],
  },
  {
    label: 'Agenda',
    href: '/agenda',
    icon: Calendar,
    roles: ['admin', 'medico', 'recepcao'],
  },
  {
    label: 'Fila de Atendimento',
    href: '/fila',
    icon: ClipboardList,
    roles: ['admin', 'medico', 'recepcao', 'enfermagem'],
  },
  {
    label: 'Painel TV',
    href: '/painel-tv',
    icon: Monitor,
    roles: ['admin', 'recepcao'],
  },
  {
    label: 'Prontuários',
    href: '/prontuarios',
    icon: FileText,
    roles: ['admin', 'medico', 'enfermagem'],
  },
  {
    label: 'Financeiro',
    href: '/financeiro',
    icon: DollarSign,
    roles: ['admin', 'financeiro'],
  },
  {
    label: 'Usuários',
    href: '/usuarios',
    icon: UserCog,
    roles: ['admin'],
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    roles: ['admin'],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const filteredItems = navItems.filter(item =>
    hasPermission(item.roles as any[])
  );

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Stethoscope className="h-6 w-6 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold text-sidebar-foreground">EloLab</h1>
          <p className="text-xs text-sidebar-foreground/60">Gestão Clínica</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-medium">
            {user?.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
