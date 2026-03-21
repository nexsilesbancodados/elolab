import {
  LayoutDashboard,
  Users,
  CalendarRange,
  ClipboardCheck,
  Shield,
  CircleDollarSign,
  PackageSearch,
  Settings2,
  Stethoscope,
  CreditCard,
  WalletCards,
  BarChart4,
  Building2,
  UserCog,
  FlaskConical,
  HeartPulse,
  DoorOpen,
  ClockAlert,
  HandCoins,
  FolderKanban,
  Sparkles,
  BotMessageSquare,
  ActivitySquare,
  ListChecks,
  TestTubes,
  BookMarked,
  LucideIcon,
  MonitorSmartphone,
  MapPinned,
  BadgeDollarSign,
  Microscope,
  ScrollText,
  PiggyBank,
  FileBarChart,
  Gauge,
} from 'lucide-react';
import { AppRole } from '@/contexts/SupabaseAuthContext';

export interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  roles?: AppRole[];
  external?: boolean;
}

export interface MenuGroup {
  label: string;
  icon: LucideIcon;
  color: string;
  items: MenuItem[];
  roles?: AppRole[];
}

export const menuGroups: MenuGroup[] = [
  {
    label: 'Principal',
    icon: Gauge,
    color: '#6366f1',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Recepção', icon: MonitorSmartphone, href: '/recepcao', roles: ['admin', 'recepcao'] },
      { label: 'Agenda', icon: CalendarRange, href: '/agenda' },
      { label: 'Pacientes', icon: Users, href: '/pacientes', roles: ['admin', 'recepcao', 'enfermagem'] },
      { label: 'Fila / Triagem', icon: ClipboardCheck, href: '/fila', roles: ['admin', 'recepcao', 'enfermagem'] },
      { label: 'Caixa Diário', icon: HandCoins, href: '/caixa', roles: ['admin', 'financeiro', 'recepcao'] },
      { label: 'Tarefas', icon: ListChecks, href: '/tarefas', roles: ['admin', 'recepcao', 'enfermagem', 'financeiro'] },
    ],
  },
  {
    label: 'Clínica',
    icon: Stethoscope,
    color: '#10b981',
    roles: ['admin', 'medico', 'enfermagem'],
    items: [
      { label: 'Exames', icon: Microscope, href: '/exames', roles: ['admin', 'medico', 'enfermagem'] },
      { label: 'Triagem', icon: HeartPulse, href: '/triagem', roles: ['admin', 'enfermagem'] },
      { label: 'Retornos', icon: ClockAlert, href: '/retornos', roles: ['admin', 'medico', 'recepcao'] },
    ],
  },
  {
    label: 'Laboratório',
    icon: TestTubes,
    color: '#0ea5e9',
    roles: ['admin', 'medico', 'enfermagem'],
    items: [
      { label: 'Painel Lab', icon: FlaskConical, href: '/laboratorio' },
      { label: 'Mapa de Coleta', icon: MapPinned, href: '/mapa-coleta', roles: ['admin', 'enfermagem'] },
      { label: 'Laudos', icon: ScrollText, href: '/laudos-lab', roles: ['admin', 'medico', 'enfermagem'] },
    ],
  },
  {
    label: 'Operacional',
    icon: PackageSearch,
    color: '#f59e0b',
    roles: ['admin', 'recepcao', 'enfermagem'],
    items: [
      { label: 'Equipe Médica', icon: Stethoscope, href: '/medicos', roles: ['admin'] },
      { label: 'Funcionários', icon: UserCog, href: '/funcionarios', roles: ['admin'] },
      { label: 'Salas', icon: DoorOpen, href: '/salas', roles: ['admin', 'recepcao'] },
      { label: 'Estoque', icon: PackageSearch, href: '/estoque', roles: ['admin', 'enfermagem'] },
      { label: 'Convênios', icon: Building2, href: '/convenios', roles: ['admin', 'recepcao'] },
      { label: 'Templates', icon: FolderKanban, href: '/templates', roles: ['admin', 'medico'] },
      { label: 'Lista de Espera', icon: ClockAlert, href: '/lista-espera', roles: ['admin', 'recepcao'] },
    ],
  },
  {
    label: 'Financeiro',
    icon: WalletCards,
    color: '#ef4444',
    roles: ['admin', 'financeiro'],
    items: [
      { label: 'Painel Financeiro', icon: CircleDollarSign, href: '/financeiro' },
      { label: 'Contas a Receber', icon: BadgeDollarSign, href: '/contas-receber' },
      { label: 'Contas a Pagar', icon: CreditCard, href: '/contas-pagar' },
      { label: 'Fluxo de Caixa', icon: PiggyBank, href: '/fluxo-caixa' },
      { label: 'Tabela de Preços', icon: CircleDollarSign, href: '/precos-exames' },
      { label: 'Tipos de Consulta', icon: Stethoscope, href: '/tipos-consulta' },
      { label: 'Relatórios', icon: FileBarChart, href: '/relatorios' },
    ],
  },
  {
    label: 'Administração',
    icon: Settings2,
    color: '#8b5cf6',
    roles: ['admin'],
    items: [
      { label: 'Painel Admin', icon: Shield, href: '/painel-admin', roles: ['admin'] },
      { label: 'Analytics', icon: ActivitySquare, href: '/analytics' },
      { label: 'Agente IA', icon: BotMessageSquare, href: '/agente-ia' },
      { label: 'Automações', icon: Sparkles, href: '/automacoes' },
      { label: 'Planos', icon: CreditCard, href: '/planos' },
      { label: 'Documentação', icon: BookMarked, href: '/documentacao' },
      { label: 'Configurações', icon: Settings2, href: '/configuracoes' },
    ],
  },
];

/**
 * Filter menu groups based on user roles
 */
export function getFilteredMenuGroups(
  userRoles: AppRole[],
  isAdmin: boolean
): MenuGroup[] {
  if (isAdmin) {
    return menuGroups;
  }

  return menuGroups
    .filter((group) => {
      if (!group.roles || group.roles.length === 0) return true;
      return group.roles.some((role) => userRoles.includes(role));
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.some((role) => userRoles.includes(role));
      }),
    }))
    .filter((group) => group.items.length > 0);
}
