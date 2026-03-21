import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface NotificationToastProps {
  type: ToastType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
  visible: boolean;
  icon?: ReactNode;
  duration?: number;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bg: "bg-success/10 border-success/20",
    iconColor: "text-success",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-destructive/10 border-destructive/20",
    iconColor: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning/10 border-warning/20",
    iconColor: "text-warning",
  },
  info: {
    icon: Info,
    bg: "bg-info/10 border-info/20",
    iconColor: "text-info",
  },
};

export function NotificationToast({
  type,
  title,
  description,
  action,
  onDismiss,
  visible,
  icon,
}: NotificationToastProps) {
  const config = toastConfig[type];
  const DefaultIcon = config.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm ${config.bg} bg-card`}
        >
          <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
            {icon || <DefaultIcon className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            {action && (
              <button
                onClick={action.onClick}
                className="text-xs font-medium text-primary hover:underline mt-2"
              >
                {action.label}
              </button>
            )}
          </div>

          {onDismiss && (
            <button onClick={onDismiss} className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
