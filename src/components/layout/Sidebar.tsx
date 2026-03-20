import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { ChevronLeft, ChevronDown, PanelLeftOpen } from 'lucide-react';
import logoIcon from '@/assets/logo-elolab-icon.png';
import { Button } from '@/components/ui/button';
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
        'flex h-screen flex-col border-r border-sidebar-border/60 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'bg-sidebar backdrop-blur-xl',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border/40',
        collapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 py-4'
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-primary/5">
              <img src={logoIcon} alt="EloLab" className="h-8 w-8 object-contain drop-shadow-md" />
              <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-sidebar" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-sidebar-foreground tracking-tight font-display leading-none">
                EloLab
              </h1>
              <p className="text-[9px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-semibold mt-0.5">
                Clínica Premium
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5">
            <img src={logoIcon} alt="EloLab" className="h-8 w-8 object-contain drop-shadow-md" />
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-sidebar" />
          </div>
        )}

        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-7 w-7 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="px-2 py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(false)}
                className="w-full h-8 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir menu</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2.5 py-3">
        <nav className="flex flex-col gap-0.5">
          {filteredMenuGroups.map((group) => (
            <SidebarMenuGroup
              key={group.label}
              group={group}
              collapsed={collapsed}
              isOpen={openGroups.includes(group.label)}
              onToggle={() => toggleGroup(group.label)}
              currentPath={location.pathname}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Version */}
      {!collapsed && (
        <div className="border-t border-sidebar-border/30 px-4 py-2.5">
          <p className="text-[10px] text-sidebar-foreground/25 text-center font-medium">
            EloLab v2.0
          </p>
        </div>
      )}
    </aside>
  );
}

interface SidebarMenuGroupProps {
  group: MenuGroup;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
}

function SidebarMenuGroup({ group, collapsed, isOpen, onToggle, currentPath }: SidebarMenuGroupProps) {
  const GroupIcon = group.icon;

  return (
    <div className="mb-0.5">
      {/* Group Header */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => !collapsed && onToggle()}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-all duration-200',
              collapsed && 'justify-center',
              'hover:bg-sidebar-accent/40 group'
            )}
          >
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
              style={{ 
                backgroundColor: `${group.color}15`,
                color: group.color 
              }}
            >
              <GroupIcon className="h-3.5 w-3.5 shrink-0" />
            </div>

            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sidebar-foreground/70 text-[13px]">{group.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-sidebar-foreground/30 transition-transform duration-300',
                    isOpen && 'rotate-180'
                  )}
                />
              </>
            )}
          </button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="font-medium">
            {group.label}
          </TooltipContent>
        )}
      </Tooltip>

      {/* Group Items - Expanded */}
      <AnimatePresence initial={false}>
        {isOpen && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 py-0.5 pl-1">
              {group.items.map((item) => (
                <SidebarNavItem key={item.href} item={item} collapsed={collapsed} groupColor={group.color} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* When collapsed, show items directly */}
      {collapsed && (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <SidebarNavItem key={item.href} item={item} collapsed={collapsed} groupColor={group.color} />
          ))}
        </div>
      )}
    </div>
  );
}
