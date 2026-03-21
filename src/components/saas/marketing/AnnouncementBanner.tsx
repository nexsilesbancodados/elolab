import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Megaphone } from "lucide-react";
import { useState, ReactNode } from "react";

interface AnnouncementBannerProps {
  message: string;
  cta?: { label: string; href?: string; onClick?: () => void };
  icon?: ReactNode;
  variant?: "default" | "gradient" | "dark" | "warning" | "celebration";
  dismissible?: boolean;
  position?: "top" | "bottom";
}

const variantStyles = {
  default: "bg-primary text-primary-foreground",
  gradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
  dark: "bg-foreground text-background",
  warning: "bg-warning text-warning-foreground",
  celebration: "bg-gradient-to-r from-info via-primary to-warning text-white",
};

export function AnnouncementBanner({
  message,
  cta,
  icon,
  variant = "gradient",
  dismissible = true,
  position = "top",
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`overflow-hidden ${position === "bottom" ? "fixed bottom-0 left-0 right-0 z-50" : ""}`}
        >
          <div className={`px-4 py-2.5 ${variantStyles[variant]}`}>
            <div className="container flex items-center justify-center gap-3 text-sm">
              {icon || (
                variant === "celebration" ? <Sparkles className="w-4 h-4 shrink-0" /> : <Megaphone className="w-4 h-4 shrink-0" />
              )}

              <span className="font-medium text-center">{message}</span>

              {cta && (
                <a
                  href={cta.href}
                  onClick={cta.onClick}
                  className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline whitespace-nowrap"
                >
                  {cta.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}

              {dismissible && (
                <button
                  onClick={() => setVisible(false)}
                  className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
