import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useKeyboardShortcuts, formatShortcut, getShortcutsByCategory } from '@/hooks/useKeyboardShortcuts';

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const { shortcuts } = useKeyboardShortcuts();
  const categories = getShortcutsByCategory(shortcuts);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Atalhos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {Object.entries(categories).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Busca</h3>
            <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Busca Global</span>
              <Badge variant="outline" className="font-mono text-xs">
                Ctrl + K
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
