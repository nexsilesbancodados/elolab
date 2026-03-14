import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  Stethoscope,
  Package,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Settings,
  FlaskConical,
  Wallet,
  Search,
  UserCheck,
  Bot,
  Zap,
  ListTodo,
  TestTube,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Static pages list ─────────────────────────────────────
const PAGES = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Navegação' },
  { label: 'Agenda', href: '/agenda', icon: Calendar, group: 'Navegação' },
  { label: 'Pacientes', href: '/pacientes', icon: Users, group: 'Navegação' },
  { label: 'Fila de Atendimento', href: '/fila', icon: ClipboardList, group: 'Navegação' },
  { label: 'Prontuários', href: '/prontuarios', icon: FileText, group: 'Clínica' },
  { label: 'Prescrições', href: '/prescricoes', icon: FileText, group: 'Clínica' },
  { label: 'Atestados', href: '/atestados', icon: FileText, group: 'Clínica' },
  { label: 'Médicos', href: '/medicos', icon: Stethoscope, group: 'Clínica' },
  { label: 'Funcionários', href: '/funcionarios', icon: UserCheck, group: 'Clínica' },
  { label: 'Exames', href: '/exames', icon: FlaskConical, group: 'Clínica' },
  { label: 'Laboratório', href: '/laboratorio', icon: TestTube, group: 'Clínica' },
  { label: 'Triagem', href: '/triagem', icon: Stethoscope, group: 'Clínica' },
  { label: 'Encaminhamentos', href: '/encaminhamentos', icon: FileText, group: 'Clínica' },
  { label: 'Financeiro', href: '/financeiro', icon: DollarSign, group: 'Financeiro' },
  { label: 'Contas a Receber', href: '/contas-receber', icon: Wallet, group: 'Financeiro' },
  { label: 'Contas a Pagar', href: '/contas-pagar', icon: Wallet, group: 'Financeiro' },
  { label: 'Fluxo de Caixa', href: '/fluxo-caixa', icon: Wallet, group: 'Financeiro' },
  { label: 'Relatórios', href: '/relatorios', icon: BarChart3, group: 'Financeiro' },
  { label: 'Estoque', href: '/estoque', icon: Package, group: 'Operacional' },
  { label: 'Convênios', href: '/convenios', icon: DollarSign, group: 'Operacional' },
  { label: 'Tarefas', href: '/tarefas', icon: ListTodo, group: 'Operacional' },
  { label: 'Agente IA', href: '/agente-ia', icon: Bot, group: 'Admin' },
  { label: 'Automações', href: '/automacoes', icon: Zap, group: 'Admin' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, group: 'Admin' },
  { label: 'Configurações', href: '/configuracoes', icon: Settings, group: 'Admin' },
];

interface Paciente {
  id: string;
  nome: string;
  cpf?: string;
  data_nascimento?: string;
}

interface Medico {
  id: string;
  nome: string;
  especialidade?: string;
  crm?: string;
}

// ─── Global Search Component ───────────────────────────────
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const { profile } = useSupabaseAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search in Supabase
  const searchSupabase = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setPacientes([]);
      setMedicos([]);
      return;
    }
    setSearching(true);
    try {
      const [pacResult, medResult] = await Promise.all([
        supabase
          .from('pacientes')
          .select('id, nome, cpf, data_nascimento')
          .or(`nome.ilike.%${q}%,cpf.ilike.%${q}%`)
          .limit(5),
        supabase
          .from('medicos')
          .select('id, especialidade, crm')
          .ilike('crm', `%${q}%`)
          .limit(3),
      ]);
      setPacientes((pacResult.data as Paciente[]) ?? []);
      setMedicos((medResult.data as unknown as Medico[]) ?? []);
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSupabase(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchSupabase]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery('');
    navigate(href);
  };

  // Filter static pages
  const filteredPages = query.trim().length > 0
    ? PAGES.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : PAGES.slice(0, 8);

  const showResults = query.trim().length >= 2;
  const hasAnyResult = filteredPages.length > 0 || pacientes.length > 0 || medicos.length > 0;

  return (
    <>
      {/* Trigger button (visible in Navbar) */}
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring md:w-52 lg:w-64"
        aria-label="Abrir busca global"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline flex-1 text-left">Buscar...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-60">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(''); }}>
        <CommandInput
          placeholder="Buscar pacientes, médicos, páginas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {searching && (
            <div className="py-3 px-4 text-sm text-muted-foreground flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Buscando...
            </div>
          )}

          {!hasAnyResult && !searching && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}

          {/* Pacientes */}
          {showResults && pacientes.length > 0 && (
            <CommandGroup heading="Pacientes">
              {pacientes.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`paciente-${p.id}-${p.nome}`}
                  onSelect={() => handleSelect('/pacientes')}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.cpf ? `CPF: ${p.cpf}` : ''}
                      {p.data_nascimento ? ` • Nasc: ${format(new Date(p.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}` : ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">Paciente</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {showResults && pacientes.length > 0 && medicos.length > 0 && <CommandSeparator />}

          {/* Médicos */}
          {showResults && medicos.length > 0 && (
            <CommandGroup heading="Médicos">
              {medicos.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`medico-${m.id}-${m.nome}`}
                  onSelect={() => handleSelect('/medicos')}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="h-8 w-8 rounded-full bg-info/10 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-4 w-4 text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{m.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.especialidade || 'Sem especialidade'}
                      {m.crm ? ` • CRM: ${m.crm}` : ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">Médico</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {(showResults && (pacientes.length > 0 || medicos.length > 0)) && filteredPages.length > 0 && (
            <CommandSeparator />
          )}

          {/* Pages */}
          {filteredPages.length > 0 && (
            <CommandGroup heading="Páginas">
              {filteredPages.map((page) => {
                const Icon = page.icon;
                return (
                  <CommandItem
                    key={page.href}
                    value={`page-${page.href}-${page.label}`}
                    onSelect={() => handleSelect(page.href)}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-sm">{page.label}</span>
                    <span className="text-[10px] text-muted-foreground">{page.group}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>

        <div className="border-t px-3 py-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">↵</kbd> abrir</span>
          <span><kbd className="font-mono">Esc</kbd> fechar</span>
        </div>
      </CommandDialog>
    </>
  );
}
