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
  MessageCircle,
  Mail,
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
  Receipt,
  UserPlus,
  CalendarCheck,
  Banknote,
} from 'lucide-react';
import { AppRole } from '@/contexts/SupabaseAuthContext';

export interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  roles?: AppRole[];
  external?: boolean;
  superAdminOnly?: boolean;
}

export interface MenuGroup {
  label: string;
  icon: LucideIcon;
  color: string;
  items: MenuItem[];
  roles?: AppRole[];
  superAdminOnly?: boolean;
}

export const menuGroups: MenuGroup[] = [
  {
    label: 'Início',
    icon: Gauge,
    color: '#6366f1',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Agenda', icon: CalendarRange, href: '/agenda' },
      { label: 'Chat Interno', icon: MessageCircle, href: '/chat' },
      { label: 'Tarefas', icon: ListChecks, href: '/tarefas', roles: ['admin', 'recepcao', 'enfermagem', 'financeiro'] },
    ],
  },
  {
    label: 'Atendimento',
    icon: MonitorSmartphone,
    color: '#0ea5e9',
    roles: ['admin', 'recepcao', 'enfermagem'],
    items: [
      { label: 'Recepção & Caixa', icon: MonitorSmartphone, href: '/recepcao', roles: ['admin', 'recepcao', 'financeiro'] },
      { label: 'Fila / Triagem', icon: ClipboardCheck, href: '/fila', roles: ['admin', 'recepcao', 'enfermagem'] },
      { label: 'Triagem', icon: HeartPulse, href: '/triagem', roles: ['admin', 'enfermagem'] },
      { label: 'Salas', icon: DoorOpen, href: '/salas', roles: ['admin', 'recepcao'] },
      { label: 'Lista de Espera', icon: ClockAlert, href: '/lista-espera', roles: ['admin', 'recepcao'] },
    ],
  },
  {
    label: 'Pacientes',
    icon: Users,
    color: '#10b981',
    roles: ['admin', 'recepcao', 'enfermagem', 'medico'],
    items: [
      { label: 'Cadastro', icon: Users, href: '/pacientes', roles: ['admin', 'recepcao', 'enfermagem'] },
      { label: 'Retornos', icon: CalendarCheck, href: '/retornos', roles: ['admin', 'medico', 'recepcao'] },
      { label: 'Convênios', icon: Building2, href: '/convenios', roles: ['admin', 'recepcao'] },
    ],
  },
  {
    label: 'Clínica',
    icon: Stethoscope,
    color: '#8b5cf6',
    roles: ['admin', 'medico', 'enfermagem'],
    items: [
      { label: 'Prontuários', icon: ScrollText, href: '/prontuarios', roles: ['admin', 'medico'] },
      { label: 'Prescrições', icon: BookMarked, href: '/prescricoes', roles: ['admin', 'medico'] },
      { label: 'Atestados', icon: FileBarChart, href: '/atestados', roles: ['admin', 'medico'] },
      { label: 'Encaminhamentos', icon: Stethoscope, href: '/encaminhamentos', roles: ['admin', 'medico'] },
      { label: 'Exames', icon: Microscope, href: '/exames', roles: ['admin', 'medico', 'enfermagem'] },
    ],
  },
  {
    label: 'Laboratório',
    icon: TestTubes,
    color: '#06b6d4',
    roles: ['admin', 'medico', 'enfermagem'],
    items: [
      { label: 'Painel Lab', icon: FlaskConical, href: '/laboratorio' },
      { label: 'Mapa de Coleta', icon: MapPinned, href: '/mapa-coleta', roles: ['admin', 'enfermagem'] },
      { label: 'Laudos', icon: ScrollText, href: '/laudos-lab', roles: ['admin', 'medico', 'enfermagem'] },
    ],
  },
  {
    label: 'Financeiro',
    icon: WalletCards,
    color: '#f59e0b',
    roles: ['admin', 'financeiro'],
    items: [
      { label: 'Visão Geral', icon: CircleDollarSign, href: '/financeiro' },
      { label: 'Caixa Diário', icon: Banknote, href: '/caixa-diario' },
      { label: 'Contas a Receber', icon: BadgeDollarSign, href: '/contas-receber' },
      { label: 'Contas a Pagar', icon: CreditCard, href: '/contas-pagar' },
      { label: 'Fluxo de Caixa', icon: PiggyBank, href: '/fluxo-caixa' },
      { label: 'Tabela de Preços', icon: CircleDollarSign, href: '/precos-exames' },
      { label: 'Tipos de Consulta', icon: Stethoscope, href: '/tipos-consulta' },
      { label: 'Relatórios', icon: FileBarChart, href: '/relatorios' },
    ],
  },
  {
    label: 'Equipe',
    icon: UserCog,
    color: '#ec4899',
    roles: ['admin'],
    items: [
      { label: 'Equipe Médica', icon: Stethoscope, href: '/medicos' },
      { label: 'Funcionários', icon: UserCog, href: '/funcionarios' },
      { label: 'Estoque', icon: PackageSearch, href: '/estoque', roles: ['admin', 'enfermagem'] },
      { label: 'Templates', icon: FolderKanban, href: '/templates', roles: ['admin', 'medico'] },
    ],
  },
  {
    label: 'Administração',
    icon: Settings2,
    color: '#ef4444',
    roles: ['admin'],
    items: [
      { label: 'Analytics', icon: ActivitySquare, href: '/analytics' },
      { label: 'Automações', icon: Sparkles, href: '/automacoes' },
      { label: 'Templates Email', icon: Mail, href: '/templates-email' },
      { label: 'Configurações', icon: Settings2, href: '/configuracoes' },
    ],
  },
  {
    label: 'Plataforma',
    icon: Shield,
    color: '#dc2626',
    roles: ['admin'],
    superAdminOnly: true,
    items: [
      { label: 'Painel Admin', icon: Shield, href: '/painel-admin', superAdminOnly: true },
      { label: 'Agente IA', icon: BotMessageSquare, href: '/agente-ia', superAdminOnly: true },
      { label: 'Planos', icon: CreditCard, href: '/planos', superAdminOnly: true },
      { label: 'Documentação', icon: BookMarked, href: '/documentacao', superAdminOnly: true },
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
