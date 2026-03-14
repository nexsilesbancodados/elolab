import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { menuGroups } from '@/config/sidebarMenu';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Search } from 'lucide-react';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { profile, isAdmin } = useSupabaseAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback(
    (href: string, external?: boolean) => {
      setOpen(false);
      if (external) {
        window.open(href, '_blank');
      } else {
        navigate(href);
      }
    },
    [navigate]
  );

  const filteredGroups = menuGroups
    .filter((group) => {
      if (isAdmin()) return true;
      if (!group.roles) return true;
      return group.roles.some((r) => profile?.roles.includes(r));
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (isAdmin()) return true;
        if (!item.roles) return true;
        return item.roles.some((r) => profile?.roles.includes(r));
      }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Busca global"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar módulos, páginas..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {filteredGroups.map((group, i) => (
            <div key={group.label}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group.label}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${group.label}`}
                    onSelect={() => handleSelect(item.href, item.external)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
