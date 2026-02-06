import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'default' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'default', className }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useTheme();

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 hover:bg-muted/50", className)}
            aria-label="Alterar tema"
          >
            {theme === 'light' ? (
              <Sun className="h-[18px] w-[18px] transition-all" />
            ) : (
              <Moon className="h-[18px] w-[18px] transition-all" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className={cn(theme === 'light' && 'bg-accent')}
          >
            <Sun className="h-4 w-4 mr-2" />
            Claro
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className={cn(theme === 'dark' && 'bg-accent')}
          >
            <Moon className="h-4 w-4 mr-2" />
            Escuro
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("h-9 w-9 hover:bg-muted/50", className)}
      aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      aria-pressed={theme === 'dark'}
    >
      {theme === 'light' ? (
        <Moon className="h-[18px] w-[18px] transition-all" aria-hidden="true" />
      ) : (
        <Sun className="h-[18px] w-[18px] transition-all" aria-hidden="true" />
      )}
    </Button>
  );
}
