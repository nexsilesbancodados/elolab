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
          'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-200',
          'text-sidebar-foreground/60 hover:text-sidebar-foreground',
          isActive && !item.external
            ? 'text-foreground bg-sidebar-accent shadow-sm font-semibold'
            : 'hover:bg-sidebar-accent/40',
          collapsed && 'justify-center px-2',
          !collapsed && 'ml-4'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator line */}
          {isActive && !item.external && !collapsed && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full transition-all"
              style={{ backgroundColor: groupColor || 'hsl(var(--primary))' }}
            />
          )}
          
          {/* Icon */}
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200',
              isActive && !item.external
                ? 'text-foreground'
                : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          
          {/* Label */}
          {!collapsed && (
            <span className="truncate flex-1">{item.label}</span>
          )}
          
          {/* Badge */}
          {!collapsed && item.badge && item.badge > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
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
            className="flex items-center gap-2 font-medium"
          >
            {item.label}
            {item.badge && item.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
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
