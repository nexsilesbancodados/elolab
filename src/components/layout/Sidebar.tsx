import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Activity, ChevronLeft, ChevronRight, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SidebarNavItem } from './SidebarNavItem';
import { getFilteredMenuGroups, MenuGroup } from '@/config/sidebarMenu';

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
      return saved ? JSON.parse(saved) : DEFAULT_OPEN_GROUPS;
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

  // Auto-expand group containing active route
  useEffect(() => {
    const activeGroup = filteredMenuGroups.find(group =>
      group.items.some(item => item.href === location.pathname)
    );
    if (activeGroup && !openGroups.includes(activeGroup.label)) {
      setOpenGroups(prev => [...prev, activeGroup.label]);
    }
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-sidebar-border transition-all duration-200 ease-out',
        'bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-xl',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border/50',
        collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-3'
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 shrink-0">
              <Activity className="h-5 w-5 text-primary-foreground" />
              <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight font-display">
                EloLab
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-medium">
                Clínica Premium
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Activity className="h-5 w-5 text-primary-foreground" />
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          </div>
        )}

        {!collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
                className="h-8 w-8 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Recolher menu</TooltipContent>
          </Tooltip>
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
                className="w-full h-8 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir menu</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col">
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
        <div className="border-t border-sidebar-border/50 px-4 py-3">
          <p className="text-[10px] text-sidebar-foreground/30 text-center">
            EloLab v2.0.0
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
  const hasActiveItem = group.items.some(item => item.href === currentPath);
  const GroupIcon = group.icon;

  return (
    <div className="mb-1">
      {/* Group Header with colored icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => !collapsed && onToggle()}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200',
              collapsed && 'justify-center',
              'hover:bg-sidebar-accent/50'
            )}
            style={{ color: group.color }}
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${group.color}20` }}
            >
              <GroupIcon className="h-4 w-4 shrink-0" />
            </div>

            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sidebar-foreground/80">{group.label}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-sidebar-foreground/40 transition-transform duration-200',
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

      {/* Group Items */}
      {(isOpen || collapsed) && (
        <div className={cn('flex flex-col gap-0.5 py-1', collapsed && 'hidden')}>
          {group.items.map((item, index) => (
            <div
              key={item.href}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <SidebarNavItem item={item} collapsed={collapsed} groupColor={group.color} />
            </div>
          ))}
        </div>
      )}

      {/* When collapsed, show items directly */}
      {collapsed && (
        <div className="space-y-1">
          {group.items.map((item) => (
            <SidebarNavItem key={item.href} item={item} collapsed={collapsed} groupColor={group.color} />
          ))}
        </div>
      )}
    </div>
  );
}
