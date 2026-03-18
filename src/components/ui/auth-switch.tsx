import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AuthSwitchProps {
  activeTab: "login" | "signup";
  onTabChange: (tab: "login" | "signup") => void;
}

export const AuthSwitch = React.forwardRef<HTMLDivElement, AuthSwitchProps>(
  ({ activeTab, onTabChange }, ref) => {
    return (
      <div ref={ref} className="relative flex w-full rounded-2xl bg-muted/50 p-1 border border-border/40">
        {/* Animated pill background */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-xl bg-card shadow-sm border border-border/30"
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            left: activeTab === "login" ? "4px" : "calc(50% + 0px)",
            width: "calc(50% - 4px)",
          }}
        />

        <button
          type="button"
          onClick={() => onTabChange("login")}
          className={cn(
            "relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200",
            activeTab === "login"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70"
          )}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => onTabChange("signup")}
          className={cn(
            "relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200",
            activeTab === "signup"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70"
          )}
        >
          Criar Conta
        </button>
      </div>
    );
  }
);

AuthSwitch.displayName = "AuthSwitch";

export default AuthSwitch;
