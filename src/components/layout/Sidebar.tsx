import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  DollarSign,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Activity,
  Receipt,
  CreditCard,
  Wallet,
  BarChart3,
  Shield,
  Building2,
  UserCheck,
  FlaskConical,
  Heart,
  DoorOpen,
  Clock,
  Tv,
  FileCheck,
  HandCoins,
  Video,
  Files,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  roles?: string[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Agenda', icon: Calendar, href: '/agenda' },
      { label: 'Pacientes', icon: Users, href: '/pacientes' },
      { label: 'Fila de Atendimento', icon: ClipboardList, href: '/fila' },
    ],
  },
  {
    label: 'Clínica',
    items: [
      { label: 'Médicos', icon: Stethoscope, href: '/medicos' },
      { label: 'Funcionários', icon: UserCheck, href: '/funcionarios' },
      { label: 'Exames', icon: FlaskConical, href: '/exames' },
      { label: 'Triagem', icon: Heart, href: '/triagem' },
      { label: 'Prontuários', icon: FileText, href: '/prontuarios' },
      { label: 'Prescrições', icon: Receipt, href: '/prescricoes' },
      { label: 'Atestados', icon: FileCheck, href: '/atestados' },
      { label: 'Salas', icon: DoorOpen, href: '/salas' },
      { label: 'Lista de Espera', icon: Clock, href: '/lista-espera' },
      { label: 'Telemedicina', icon: Video, href: '/telemedicina' },
      { label: 'Encaminhamentos', icon: ArrowRightLeft, href: '/encaminhamentos' },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { label: 'Templates', icon: Files, href: '/templates' },
      { label: 'Estoque', icon: Package, href: '/estoque' },
      { label: 'Convênios', icon: Building2, href: '/convenios' },
      { label: 'Painel TV', icon: Tv, href: '/painel-tv' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Visão Geral', icon: DollarSign, href: '/financeiro' },
      { label: 'Contas a Receber', icon: HandCoins, href: '/contas-receber' },
      { label: 'Contas a Pagar', icon: CreditCard, href: '/contas-pagar' },
      { label: 'Fluxo de Caixa', icon: Wallet, href: '/fluxo-caixa' },
      { label: 'Relatórios', icon: BarChart3, href: '/relatorios' },
    ],
  },
  {
    label: 'Administração',
    items: [
      { label: 'Configurações', icon: Settings, href: '/configuracoes' },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { hasAnyRole } = useSupabaseAuth();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('elolab_sidebar_collapsed');
    return saved === 'true';
  });
  const [openGroups, setOpenGroups] = useState<string[]>(['Principal', 'Clínica']);

  useEffect(() => {
    localStorage.setItem('elolab_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === '/painel-tv') return false;
    return location.pathname === href;
  };

  const NavItem = ({ item }: { item: MenuItem }) => {
    const active = isActive(item.href);
    const isExternal = item.href === '/painel-tv';

    const content = (
      <Link
        to={item.href}
        target={isExternal ? '_blank' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          active
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        <item.icon className={cn('h-5 w-5 shrink-0', active && 'text-primary-foreground')} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-xs">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">EloLab</h1>
              <p className="text-xs text-sidebar-foreground/60">Clínica</p>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && <Separator className="my-4 bg-sidebar-border" />}
              
              {collapsed ? (
                <div className="space-y-1">
                  {group.items.map(item => (
                    <NavItem key={item.href} item={item} />
                  ))}
                </div>
              ) : (
                <Collapsible
                  open={openGroups.includes(group.label)}
                  onOpenChange={() => toggleGroup(group.label)}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80">
                    {group.label}
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform',
                        openGroups.includes(group.label) && 'rotate-90'
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pt-1">
                    {group.items.map(item => (
                      <NavItem key={item.href} item={item} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'px-2'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="mr-2 h-4 w-4" />Recolher</>}
        </Button>
      </div>
    </aside>
  );
}
