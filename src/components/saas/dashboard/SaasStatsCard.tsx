import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SaasStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color?: "primary" | "info" | "success" | "warning" | "destructive";
  variant?: "default" | "glass" | "gradient" | "minimal" | "outlined";
  sparkline?: number[];
  index?: number;
}

const colorConfig = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    gradient: "from-primary/15 to-primary/5",
    border: "border-primary/20",
  },
  info: {
    bg: "bg-info/10",
    text: "text-info",
    gradient: "from-info/15 to-info/5",
    border: "border-info/20",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
    gradient: "from-success/15 to-success/5",
    border: "border-success/20",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    gradient: "from-warning/15 to-warning/5",
    border: "border-warning/20",
  },
  destructive: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    gradient: "from-destructive/15 to-destructive/5",
    border: "border-destructive/20",
  },
};

export function SaasStatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = "primary",
  variant = "default",
  sparkline,
  index = 0,
}: SaasStatsCardProps) {
  const cfg = colorConfig[color];
  const TrendIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : Minus;
  const trendColor = change && change > 0 ? "text-success" : change && change < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
        variant === "glass"
          ? "glass-card"
          : variant === "gradient"
          ? `bg-gradient-to-br ${cfg.gradient} border ${cfg.border}`
          : variant === "outlined"
          ? `border-2 ${cfg.border} bg-transparent`
          : variant === "minimal"
          ? "bg-transparent"
          : "bg-card border border-border hover:shadow-lg"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display mt-2 tracking-tight">{value}</p>

          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
              <span className={`text-xs font-semibold ${trendColor}`}>
                {change > 0 ? "+" : ""}{change}%
              </span>
              {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg}`}>
          <Icon className={`w-6 h-6 ${cfg.text}`} />
        </div>
      </div>

      {/* Mini sparkline */}
      {sparkline && sparkline.length > 0 && (
        <div className="mt-4 flex items-end gap-0.5 h-8">
          {sparkline.map((val, i) => {
            const max = Math.max(...sparkline);
            const height = max > 0 ? (val / max) * 100 : 0;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-all ${cfg.bg} ${i === sparkline.length - 1 ? cfg.text.replace("text-", "bg-") : ""}`}
                style={{ height: `${Math.max(height, 8)}%` }}
              />
            );
          })}
        </div>
      )}

      {/* Background decoration */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${cfg.bg} opacity-50`} />
    </motion.div>
  );
}
