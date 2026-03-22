import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { ChevronLeft, ChevronDown, PanelLeftOpen, Search } from 'lucide-react';
import logoIcon from '@/assets/logo-elolab-icon.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SidebarNavItem } from './SidebarNavItem';
import { getFilteredMenuGroups, MenuGroup } from '@/config/sidebarMenu';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'elolab_sidebar_collapsed';
const GROUPS_KEY = 'elolab_sidebar_groups';
const DEFAULT_OPEN_GROUPS = ['Principal', 'Clínica'];

export function Sidebar() {
  const { profile, isAdmin } = useSupabaseAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'true';
  });

  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(GROUPS_KEY);
      if (!saved) return DEFAULT_OPEN_GROUPS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string')
        ? parsed
        : DEFAULT_OPEN_GROUPS;
    } catch {
      return DEFAULT_OPEN_GROUPS;
    }
  });

  const filteredMenuGroups = getFilteredMenuGroups(
    profile?.roles || [],
    isAdmin()
  );

  const searchedGroups = search.trim()
    ? filteredMenuGroups
        .map(g => ({
          ...g,
          items: g.items.filter(i =>
            i.label.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter(g => g.items.length > 0)
    : filteredMenuGroups;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  useEffect(() => {
    const activeGroup = filteredMenuGroups.find(group =>
      group.items.some(item => item.href === location.pathname)
    );
    if (activeGroup) {
      setOpenGroups(prev =>
        prev.includes(activeGroup.label) ? prev : [...prev, activeGroup.label]
      );
    }
  }, [location.pathname, filteredMenuGroups]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'bg-sidebar border-r border-sidebar-border/40',
        collapsed ? 'w-[66px]' : 'w-[252px]'
      )}
      style={{ background: 'var(--gradient-sidebar)' }}
    >
      {/* ─── Header ─── */}
      <div className={cn(
        'flex items-center shrink-0',
        collapsed ? 'justify-center px-2 h-16' : 'justify-between px-4 h-16'
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl shrink-0 overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15">
              <img src={logoIcon} alt="EloLab" className="h-7 w-7 object-contain" />
              <div className="absolute -right-px -top-px h-2 w-2 rounded-full bg-primary ring-2 ring-sidebar animate-pulse" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                EloLab
              </span>
              <span className="text-[10px] text-sidebar-foreground/35 font-medium mt-0.5 tracking-widest uppercase">
                Gestão Clínica
              </span>
            </div>
          </div>
        ) : (
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15">
            <img src={logoIcon} alt="EloLab" className="h-7 w-7 object-contain" />
            <div className="absolute -right-px -top-px h-2 w-2 rounded-full bg-primary ring-2 ring-sidebar animate-pulse" />
          </div>
        )}

        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-7 w-7 rounded-lg text-sidebar-foreground/25 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/60"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* ─── Search ─── */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/25" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-sidebar-accent/40 border-sidebar-border/30 rounded-lg placeholder:text-sidebar-foreground/20 focus-visible:ring-sidebar-primary/25 focus-visible:bg-sidebar-accent/70"
            />
          </div>
        </div>
      )}

      {/* ─── Expand trigger (collapsed) ─── */}
      {collapsed && (
        <div className="px-2 pb-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(false)}
                className="w-full h-8 rounded-lg text-sidebar-foreground/25 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/60"
              >
                <PanelLeftOpen className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir menu</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* ─── Navigation ─── */}
      <ScrollArea className="flex-1 px-2 py-1">
        <nav className="flex flex-col gap-0.5">
          {searchedGroups.map((group) => (
            <SidebarMenuGroup
              key={group.label}
              group={group}
              collapsed={collapsed}
              isOpen={openGroups.includes(group.label) || !!search.trim()}
              onToggle={() => toggleGroup(group.label)}
              currentPath={location.pathname}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* ─── Footer ─── */}
      {!collapsed && (
        <div className="shrink-0 border-t border-sidebar-border/20 px-4 py-2">
          <p className="text-[9px] text-sidebar-foreground/15 text-center font-medium tracking-widest uppercase">
            v2.0 • EloLab
          </p>
        </div>
      )}
    </aside>
  );
}

// ─── Group Component ───

interface SidebarMenuGroupProps {
  group: MenuGroup;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
}

function SidebarMenuGroup({ group, collapsed, isOpen, onToggle, currentPath }: SidebarMenuGroupProps) {
  const GroupIcon = group.icon;
  const hasActiveChild = group.items.some(item => item.href === currentPath);

  return (
    <div className="mb-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => !collapsed && onToggle()}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150',
              collapsed && 'justify-center',
              hasActiveChild
                ? 'text-sidebar-foreground/65'
                : 'text-sidebar-foreground/30 hover:text-sidebar-foreground/50',
            )}
          >
            {collapsed ? (
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: `${group.color}10`,
                  color: group.color,
                }}
              >
                <GroupIcon className="h-3.5 w-3.5" />
              </div>
            ) : (
              <>
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 text-sidebar-foreground/15 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </>
            )}
          </button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="font-medium text-xs">
            {group.label}
          </TooltipContent>
        )}
      </Tooltip>

      <AnimatePresence initial={false}>
        {isOpen && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-px py-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.href} item={item} collapsed={collapsed} groupColor={group.color} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {collapsed && (
        <div className="space-y-px">
          {group.items.map((item) => (
            <SidebarNavItem key={item.href} item={item} collapsed={collapsed} groupColor={group.color} />
          ))}
        </div>
      )}
    </div>
  );
}
