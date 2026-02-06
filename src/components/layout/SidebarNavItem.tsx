import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MenuItem } from '@/config/sidebarMenu';

interface SidebarNavItemProps {
  item: MenuItem;
  collapsed: boolean;
}

export function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
  const location = useLocation();
  
  const isActive = () => {
    // Don't show active state for external links
    if (item.external) return false;
    return location.pathname === item.href;
  };

  const active = isActive();
  const Icon = item.icon;

  const content = (
    <Link
      to={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary-foreground')} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-xs">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
