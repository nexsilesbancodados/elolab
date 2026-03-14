import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  DollarSign,
  Package,
  Settings,
  Stethoscope,
  Receipt,
  CreditCard,
  Wallet,
  BarChart3,
  Building2,
  UserCheck,
  FlaskConical,
  Heart,
  DoorOpen,
  Clock,
  Tv,
  FileCheck,
  HandCoins,
  Files,
  ArrowRightLeft,
  Zap,
  Bot,
  Activity,
  ListTodo,
  TestTube,
  LucideIcon,
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
    icon: LayoutDashboard,
    color: '#6366f1',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Agenda', icon: Calendar, href: '/agenda' },
      { label: 'Pacientes', icon: Users, href: '/pacientes' },
      { label: 'Fila de Atendimento', icon: ClipboardList, href: '/fila' },
    ],
  },
  {
    label: 'Clínica',
    icon: Stethoscope,
    color: '#10b981',
    roles: ['admin', 'medico', 'enfermagem'],
    items: [
      { label: 'Médicos', icon: Stethoscope, href: '/medicos' },
      { label: 'Funcionários', icon: UserCheck, href: '/funcionarios', roles: ['admin'] },
      { label: 'Exames', icon: FlaskConical, href: '/exames' },
      { label: 'Laboratório', icon: TestTube, href: '/laboratorio' },
      { label: 'Triagem', icon: Heart, href: '/triagem', roles: ['admin', 'enfermagem'] },
      { label: 'Prontuários', icon: FileText, href: '/prontuarios', roles: ['admin', 'medico'] },
      { label: 'Prescrições', icon: Receipt, href: '/prescricoes', roles: ['admin', 'medico'] },
      { label: 'Atestados', icon: FileCheck, href: '/atestados', roles: ['admin', 'medico'] },
      { label: 'Salas', icon: DoorOpen, href: '/salas' },
      { label: 'Lista de Espera', icon: Clock, href: '/lista-espera' },
      { label: 'Encaminhamentos', icon: ArrowRightLeft, href: '/encaminhamentos', roles: ['admin', 'medico'] },
      { label: 'Retornos', icon: Clock, href: '/retornos' },
    ],
  },
  {
    label: 'Operacional',
    icon: Package,
    color: '#f59e0b',
    items: [
      { label: 'Templates', icon: Files, href: '/templates', roles: ['admin', 'medico'] },
      { label: 'Estoque', icon: Package, href: '/estoque' },
      { label: 'Convênios', icon: Building2, href: '/convenios', roles: ['admin', 'recepcao'] },
      { label: 'Preços Exames', icon: DollarSign, href: '/precos-exames', roles: ['admin', 'financeiro'] },
      { label: 'Tarefas', icon: ListTodo, href: '/tarefas' },
      { label: 'Painel TV', icon: Tv, href: '/painel-tv', external: true },
    ],
  },
  {
    label: 'Financeiro',
    icon: Wallet,
    color: '#ef4444',
    roles: ['admin', 'financeiro'],
    items: [
      { label: 'Visão Geral', icon: DollarSign, href: '/financeiro' },
      { label: 'Contas a Receber', icon: HandCoins, href: '/contas-receber' },
      { label: 'Contas a Pagar', icon: CreditCard, href: '/contas-pagar' },
      { label: 'Fluxo de Caixa', icon: Wallet, href: '/fluxo-caixa' },
      { label: 'Pagamentos MP', icon: CreditCard, href: '/pagamentos' },
      { label: 'Relatórios', icon: BarChart3, href: '/relatorios' },
    ],
  },
  {
    label: 'Administração',
    icon: Settings,
    color: '#8b5cf6',
    roles: ['admin'],
    items: [
      { label: 'Analytics', icon: Activity, href: '/analytics' },
      { label: 'Agente IA', icon: Bot, href: '/agente-ia' },
      { label: 'Automações', icon: Zap, href: '/automacoes' },
      { label: 'Planos', icon: CreditCard, href: '/planos' },
      { label: 'Configurações', icon: Settings, href: '/configuracoes' },
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
