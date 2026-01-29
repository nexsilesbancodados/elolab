import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Pill,
  FileCheck,
  Building2,
  Package,
  Bell,
  MessageSquare,
  Receipt,
  CreditCard,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: number;
  external?: boolean;
}

interface NavGroup {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'medico', 'recepcao', 'enfermagem', 'financeiro'],
      },
      {
        label: 'Agenda',
        href: '/agenda',
        icon: Calendar,
        roles: ['admin', 'medico', 'recepcao'],
      },
      {
        label: 'Pacientes',
        href: '/pacientes',
        icon: Users,
        roles: ['admin', 'medico', 'recepcao', 'enfermagem'],
      },
      {
        label: 'Fila de Atendimento',
        href: '/fila',
        icon: ClipboardList,
        roles: ['admin', 'medico', 'recepcao', 'enfermagem'],
      },
    ],
  },
  {
    label: 'Clínica',
    items: [
      {
        label: 'Prontuários',
        href: '/prontuarios',
        icon: FileText,
        roles: ['admin', 'medico', 'enfermagem'],
      },
      {
        label: 'Prescrições',
        href: '/prescricoes',
        icon: Pill,
        roles: ['admin', 'medico'],
      },
      {
        label: 'Atestados',
        href: '/atestados',
        icon: FileCheck,
        roles: ['admin', 'medico'],
      },
      {
        label: 'Painel TV',
        href: '/painel-tv',
        icon: Monitor,
        roles: ['admin', 'recepcao'],
        external: true,
      },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      {
        label: 'Visão Geral',
        href: '/financeiro',
        icon: DollarSign,
        roles: ['admin', 'financeiro'],
      },
      {
        label: 'Contas a Receber',
        href: '/contas-receber',
        icon: Receipt,
        roles: ['admin', 'financeiro'],
      },
      {
        label: 'Contas a Pagar',
        href: '/contas-pagar',
        icon: CreditCard,
        roles: ['admin', 'financeiro'],
      },
      {
        label: 'Relatórios',
        href: '/relatorios',
        icon: BarChart3,
        roles: ['admin', 'financeiro', 'medico'],
      },
    ],
  },
  {
    label: 'Operacional',
    items: [
      {
        label: 'Estoque',
        href: '/estoque',
        icon: Package,
        roles: ['admin', 'enfermagem'],
      },
      {
        label: 'Convênios',
        href: '/convenios',
        icon: Building2,
        roles: ['admin', 'financeiro', 'recepcao'],
      },
    ],
  },
  {
    label: 'Administração',
    items: [
      {
        label: 'Usuários',
        href: '/usuarios',
        icon: UserCog,
        roles: ['admin'],
      },
      {
        label: 'Segurança',
        href: '/seguranca',
        icon: Shield,
        roles: ['admin'],
      },
      {
        label: 'Configurações',
        href: '/configuracoes',
        icon: Settings,
        roles: ['admin'],
      },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.roles as any[])),
    }))
    .filter((group) => group.items.length > 0);

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;

    const content = (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-sidebar-primary-foreground')} />
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </div>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {item.external ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <Link to={item.href}>{content}</Link>
            )}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.label}
            {item.badge && item.badge > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                {item.badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return item.external ? (
      <a href={item.href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    ) : (
      <Link to={item.href}>{content}</Link>
    );
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sidebar-transition',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-lg">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h1 className="font-display text-lg font-bold text-sidebar-foreground">EloLab</h1>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
                Gestão Clínica
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {filteredGroups.map((group, index) => (
            <div key={group.label}>
              {!isCollapsed && (
                <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {group.label}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItemComponent key={item.href} item={item} />
                ))}
              </div>
              {index < filteredGroups.length - 1 && !isCollapsed && (
                <Separator className="mt-4 bg-sidebar-border" />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        {!isCollapsed ? (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-sidebar-accent/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-white font-semibold shadow">
                {user?.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.nome}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
