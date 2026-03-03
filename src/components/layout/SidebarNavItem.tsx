import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MenuItem } from '@/config/sidebarMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronRight } from 'lucide-react';

interface SidebarNavItemProps {
  item: MenuItem;
  collapsed: boolean;
  groupColor?: string;
}

export function SidebarNavItem({ item, collapsed, groupColor }: SidebarNavItemProps) {
  const Icon = item.icon;

  const linkContent = (
    <NavLink
      to={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'text-sidebar-foreground/70 hover:text-sidebar-foreground',
          isActive && !item.external
            ? 'text-white shadow-sm'
            : 'hover:bg-sidebar-accent/50',
          collapsed && 'justify-center px-2',
          !collapsed && 'ml-6'
        )
      }
      style={({ isActive }) => isActive && !item.external && groupColor ? { backgroundColor: groupColor } : {}}
    >
      {({ isActive }) => (
        <>
          {/* Icon container */}
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
              isActive && !item.external
                ? 'text-white'
                : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          
          {/* Label */}
          {!collapsed && (
            <span className="truncate flex-1">{item.label}</span>
          )}

          {/* Active chevron */}
          {isActive && !item.external && !collapsed && (
            <ChevronRight className="h-3 w-3" />
          )}
          
          {/* Badge */}
          {!collapsed && item.badge && item.badge > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary px-1.5 text-[10px] font-bold text-sidebar-primary-foreground">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="flex items-center gap-2 bg-sidebar text-sidebar-foreground border-sidebar-border"
          >
            {item.label}
            {item.badge && item.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary px-1.5 text-[10px] font-bold text-sidebar-primary-foreground">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
