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
      style={({ isActive }: { isActive: boolean }) =>
        isActive && !item.external && groupColor
          ? { backgroundColor: `${groupColor}14`, '--active-color': groupColor } as React.CSSProperties
          : undefined
      }
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-200',
          'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/60',
          isActive && !item.external && 'font-semibold shadow-[0_1px_3px_hsl(220_20%_20%/0.06)]',
          collapsed && 'justify-center px-2',
          !collapsed && 'ml-1'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator */}
          {isActive && !item.external && !collapsed && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
              style={{ backgroundColor: groupColor || 'hsl(var(--sidebar-primary))' }}
            />
          )}

          {/* Icon */}
          <Icon
            className="h-4 w-4 shrink-0 transition-colors duration-150"
            style={{
              color: isActive && !item.external
                ? groupColor || 'hsl(var(--sidebar-primary))'
                : groupColor
                  ? `${groupColor}99`
                  : undefined,
            }}
          />

          {/* Label */}
          {!collapsed && (
            <span
              className="truncate flex-1 transition-colors duration-150"
              style={isActive && !item.external && groupColor ? { color: groupColor } : undefined}
            >
              {item.label}
            </span>
          )}

          {/* Badge */}
          {!collapsed && item.badge && item.badge > 0 && (
            <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary tabular-nums">
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
            className="flex items-center gap-2 font-medium text-xs"
          >
            {item.label}
            {item.badge && item.badge > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary">
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
