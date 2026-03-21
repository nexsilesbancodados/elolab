import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PartyPopper, ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface SuccessStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  variant?: "default" | "celebration" | "minimal" | "fullscreen";
  confetti?: boolean;
}

export function SuccessState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  variant = "default",
  confetti,
}: SuccessStateProps) {
  const isFullscreen = variant === "fullscreen";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center text-center ${isFullscreen ? "min-h-screen" : "py-12 px-6"}`}
    >
      {confetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                background: ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--info))", "hsl(var(--success))"][i % 4],
              }}
              initial={{ top: "-10%", rotate: 0, opacity: 1 }}
              animate={{
                top: "110%",
                rotate: Math.random() * 360,
                opacity: 0,
                x: (Math.random() - 0.5) * 200,
              }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
      >
        {icon || (
          <div className={`rounded-full flex items-center justify-center ${
            variant === "celebration"
              ? "w-20 h-20 bg-gradient-to-br from-success/20 to-primary/20"
              : "w-16 h-16 bg-success/10"
          }`}>
            {variant === "celebration" ? (
              <PartyPopper className="w-10 h-10 text-primary" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-success" />
            )}
          </div>
        )}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 text-2xl font-bold font-display"
      >
        {title}
      </motion.h2>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-3 text-muted-foreground max-w-md"
        >
          {description}
        </motion.p>
      )}

      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex gap-3 mt-8"
        >
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className="gap-2 group">
              {primaryAction.label}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
