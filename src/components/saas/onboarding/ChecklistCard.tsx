import { motion } from "framer-motion";
import { Check, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  onClick?: () => void;
}

interface ChecklistCardProps {
  title?: string;
  subtitle?: string;
  items: ChecklistItem[];
  dismissible?: boolean;
  onDismiss?: () => void;
  variant?: "default" | "inline" | "compact";
}

export function ChecklistCard({
  title = "Primeiros passos",
  subtitle,
  items,
  dismissible,
  onDismiss,
  variant = "default",
}: ChecklistCardProps) {
  const completedCount = items.filter(i => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold font-display">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {dismissible && (
            <Button variant="ghost" size="sm" onClick={onDismiss} className="text-muted-foreground text-xs">
              Fechar
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground font-medium">
            {completedCount}/{items.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={item.onClick}
            disabled={item.completed}
            className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
              item.completed
                ? "opacity-60"
                : "hover:bg-muted/30 cursor-pointer"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              item.completed
                ? "bg-success text-success-foreground"
                : "border-2 border-muted-foreground/30"
            }`}>
              {item.completed ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3 text-transparent" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.completed ? "line-through" : ""}`}>{item.title}</p>
              {item.description && variant !== "compact" && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              )}
            </div>

            {!item.completed && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
