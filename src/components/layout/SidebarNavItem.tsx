import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MenuItem } from '@/config/sidebarMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarNavItemProps {
  item: MenuItem;
  collapsed: boolean;
}

export function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
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
            ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
            : 'hover:bg-sidebar-accent/50',
          collapsed && 'justify-center px-2'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator */}
          {isActive && !item.external && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-sidebar-primary shadow-lg shadow-sidebar-primary/30" />
          )}
          
          {/* Icon container */}
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
              isActive && !item.external
                ? 'bg-sidebar-primary/15 text-sidebar-primary'
                : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground group-hover:bg-sidebar-accent/50'
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          
          {/* Label */}
          {!collapsed && (
            <span className="truncate">{item.label}</span>
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
