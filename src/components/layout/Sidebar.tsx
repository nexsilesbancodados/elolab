import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

  // Get filtered menu based on user roles
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
        'flex h-screen flex-col border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <SidebarHeader collapsed={collapsed} />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
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
        'flex h-16 items-center border-b border-sidebar-border px-4',
        collapsed && 'justify-center'
      )}
    >
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
    <div>
      {showSeparator && <Separator className="my-4 bg-sidebar-border" />}

      {collapsed ? (
        // Collapsed mode: just show icons
        <div className="space-y-1">
          {group.items.map((item) => (
            <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      ) : (
        // Expanded mode: collapsible groups
        <Collapsible open={isOpen} onOpenChange={onToggle}>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80">
            {group.label}
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform',
                isOpen && 'rotate-90'
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1">
            {group.items.map((item) => (
              <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
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
    <div className="border-t border-sidebar-border p-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          'w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          collapsed && 'px-2'
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Recolher
          </>
        )}
      </Button>
    </div>
  );
}
