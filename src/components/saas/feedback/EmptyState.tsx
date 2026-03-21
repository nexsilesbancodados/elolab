import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideIcon, Plus, Search, FolderOpen, Inbox, FileX, WifiOff } from "lucide-react";
import { ReactNode } from "react";

type EmptyStateType = "no-data" | "no-results" | "no-access" | "error" | "offline" | "custom";

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: LucideIcon;
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  secondaryAction?: { label: string; onClick: () => void };
  compact?: boolean;
}

const defaultIcons: Record<EmptyStateType, LucideIcon> = {
  "no-data": Inbox,
  "no-results": Search,
  "no-access": FolderOpen,
  "error": FileX,
  "offline": WifiOff,
  "custom": Inbox,
};

export function EmptyState({
  type = "no-data",
  icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  const Icon = icon || defaultIcons[type];
  const ActionIcon = action?.icon || Plus;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 px-4" : "py-16 px-8"}`}
    >
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <div className={`rounded-2xl bg-muted/50 flex items-center justify-center mb-6 ${compact ? "w-12 h-12" : "w-16 h-16"}`}>
          <Icon className={`text-muted-foreground/50 ${compact ? "w-6 h-6" : "w-8 h-8"}`} />
        </div>
      )}

      <h3 className={`font-semibold font-display ${compact ? "text-base" : "text-lg"}`}>{title}</h3>
      {description && (
        <p className={`text-muted-foreground mt-2 max-w-sm ${compact ? "text-xs" : "text-sm"}`}>{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="flex gap-3 mt-6">
          {action && (
            <Button onClick={action.onClick} size={compact ? "sm" : "default"} className="gap-2">
              <ActionIcon className="w-4 h-4" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick} size={compact ? "sm" : "default"}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
