import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Activity, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SidebarNavItem } from './SidebarNavItem';
import { getFilteredMenuGroups, MenuGroup } from '@/config/sidebarMenu';

const STORAGE_KEY = 'elolab_sidebar_collapsed';
const DEFAULT_OPEN_GROUPS = ['Principal', 'Clínica'];

export function Sidebar() {
  const { profile, isAdmin } = useSupabaseAuth();
  
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'true';
  });
  
  const [openGroups, setOpenGroups] = useState<string[]>(DEFAULT_OPEN_GROUPS);

  const filteredMenuGroups = getFilteredMenuGroups(
    profile?.roles || [],
    isAdmin()
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-sidebar-border transition-all duration-300 ease-out',
        'bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-xl',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Header */}
      <SidebarHeader collapsed={collapsed} />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredMenuGroups.map((group, groupIndex) => (
            <SidebarMenuGroup
              key={group.label}
              group={group}
              collapsed={collapsed}
              isOpen={openGroups.includes(group.label)}
              onToggle={() => toggleGroup(group.label)}
              showSeparator={groupIndex > 0}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <SidebarFooter collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
    </aside>
  );
}

interface SidebarHeaderProps {
  collapsed: boolean;
}

function SidebarHeader({ collapsed }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex h-16 items-center border-b border-sidebar-border/50 px-4',
        collapsed && 'justify-center px-2'
      )}
    >
      {!collapsed ? (
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
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
    </div>
  );
}

interface SidebarMenuGroupProps {
  group: MenuGroup;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  showSeparator: boolean;
}

function SidebarMenuGroup({
  group,
  collapsed,
  isOpen,
  onToggle,
  showSeparator,
}: SidebarMenuGroupProps) {
  return (
    <div className={cn(showSeparator && 'pt-4 mt-4 border-t border-sidebar-border/30')}>
      {collapsed ? (
        <div className="space-y-1">
          {group.items.map((item) => (
            <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      ) : (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground/80 transition-colors duration-200">
            <span className="flex items-center gap-2">
              {group.label}
            </span>
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isOpen && 'rotate-90'
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 pt-1">
            {group.items.map((item, index) => (
              <div 
                key={item.href}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <SidebarNavItem item={item} collapsed={collapsed} />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

interface SidebarFooterProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarFooter({ collapsed, onToggle }: SidebarFooterProps) {
  return (
    <div className="border-t border-sidebar-border/50 p-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          'w-full text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          'rounded-lg transition-all duration-200',
          collapsed && 'px-2'
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="mr-2 h-4 w-4" />
            <span className="text-xs">Recolher</span>
          </>
        )}
      </Button>
    </div>
  );
}
