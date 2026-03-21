import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { useState, ReactNode } from "react";

interface WelcomeBannerProps {
  title: string;
  subtitle?: string;
  cta?: { label: string; onClick: () => void };
  dismissible?: boolean;
  illustration?: ReactNode;
  variant?: "default" | "gradient" | "glass" | "celebration";
  userName?: string;
}

export function WelcomeBanner({
  title,
  subtitle,
  cta,
  dismissible = true,
  illustration,
  variant = "gradient",
  userName,
}: WelcomeBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const displayTitle = userName ? title.replace("{name}", userName) : title;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`relative overflow-hidden rounded-2xl p-6 lg:p-8 ${
        variant === "gradient"
          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-info/5 border border-primary/15"
          : variant === "glass"
          ? "glass-card"
          : variant === "celebration"
          ? "bg-gradient-to-r from-warning/10 via-primary/10 to-info/10 border border-primary/20"
          : "bg-card border border-border"
      }`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
      {variant === "celebration" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-[10%] w-2 h-2 bg-warning rounded-full animate-bounce-subtle" />
          <div className="absolute top-4 left-[30%] w-1.5 h-1.5 bg-primary rounded-full animate-bounce-subtle stagger-2" />
          <div className="absolute top-3 right-[20%] w-2 h-2 bg-info rounded-full animate-bounce-subtle stagger-3" />
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-xl lg:text-2xl font-bold font-display">{displayTitle}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-2 max-w-lg">{subtitle}</p>}
          {cta && (
            <Button
              onClick={cta.onClick}
              className="mt-4 gap-2 group"
              size="sm"
            >
              {cta.label}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          )}
        </div>

        {illustration && <div className="hidden lg:block">{illustration}</div>}
      </div>

      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
