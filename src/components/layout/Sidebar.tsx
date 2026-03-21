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

  // Filter by search
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
        'bg-sidebar border-r border-sidebar-border/50',
        collapsed ? 'w-[68px]' : 'w-[256px]'
      )}
    >
      {/* ─── Header ─── */}
      <div className={cn(
        'flex items-center shrink-0',
        collapsed ? 'justify-center px-2 h-[72px]' : 'justify-between px-4 h-[72px]'
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl shrink-0 overflow-hidden bg-gradient-to-br from-emerald-400/20 to-teal-500/10 ring-1 ring-emerald-500/20 shadow-sm">
              <img src={logoIcon} alt="EloLab" className="h-8 w-8 object-contain" />
              <div className="absolute -right-px -top-px h-2.5 w-2.5 rounded-full bg-emerald-500 ring-[2.5px] ring-sidebar animate-pulse" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[16px] font-extrabold text-sidebar-foreground tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                EloLab
              </span>
              <span className="text-[10.5px] text-sidebar-foreground/40 font-medium mt-0.5 tracking-wide uppercase">
                Gestão Clínica
              </span>
            </div>
          </div>
        ) : (
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-emerald-400/20 to-teal-500/10 ring-1 ring-emerald-500/20 shadow-sm">
            <img src={logoIcon} alt="EloLab" className="h-8 w-8 object-contain" />
            <div className="absolute -right-px -top-px h-2.5 w-2.5 rounded-full bg-emerald-500 ring-[2.5px] ring-sidebar animate-pulse" />
          </div>
        )}

        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-7 w-7 rounded-lg text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* ─── Search ─── */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/30" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-sidebar-accent/50 border-sidebar-border/40 rounded-lg placeholder:text-sidebar-foreground/25 focus-visible:ring-sidebar-primary/30"
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
                className="w-full h-8 rounded-lg text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <PanelLeftOpen className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir menu</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* ─── Navigation ─── */}
      <ScrollArea className="flex-1 px-2.5 py-1">
        <nav className="flex flex-col gap-px">
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
        <div className="shrink-0 border-t border-sidebar-border/30 px-4 py-2.5">
          <p className="text-[10px] text-sidebar-foreground/20 text-center font-medium tracking-wide">
            v2.0
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
    <div className="mb-1">
      {/* Group Header */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => !collapsed && onToggle()}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150',
              collapsed && 'justify-center',
              hasActiveChild
                ? 'text-sidebar-foreground/70'
                : 'text-sidebar-foreground/35 hover:text-sidebar-foreground/55',
            )}
          >
            {collapsed ? (
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${group.color}12`,
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
                    'h-3 w-3 text-sidebar-foreground/20 transition-transform duration-200',
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

      {/* Expanded Items */}
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

      {/* Collapsed Items */}
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
