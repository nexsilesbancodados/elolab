import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface KPI {
  label: string;
  value: string | number;
  target?: string | number;
  progress?: number;
  change?: number;
  icon?: LucideIcon;
  status?: "on-track" | "at-risk" | "behind";
}

interface KPIPanelProps {
  title?: string;
  kpis: KPI[];
  variant?: "default" | "compact" | "detailed";
  columns?: 2 | 3 | 4;
}

const statusColors = {
  "on-track": "text-success bg-success/10",
  "at-risk": "text-warning bg-warning/10",
  "behind": "text-destructive bg-destructive/10",
};

const statusLabels = {
  "on-track": "No alvo",
  "at-risk": "Em risco",
  "behind": "Atrasado",
};

export function KPIPanel({ title, kpis, variant = "default", columns = 4 }: KPIPanelProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div>
      {title && <h3 className="text-lg font-semibold font-display mb-4">{title}</h3>}

      <div className={`grid gap-4 ${gridCols[columns]}`}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {Icon && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                </div>
                {kpi.status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[kpi.status]}`}>
                    {statusLabels[kpi.status]}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-display">{kpi.value}</span>
                {kpi.target && variant === "detailed" && (
                  <span className="text-sm text-muted-foreground">/ {kpi.target}</span>
                )}
              </div>

              {kpi.change !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {kpi.change >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
                  )}
                  <span className={`text-xs font-medium ${kpi.change >= 0 ? "text-success" : "text-destructive"}`}>
                    {kpi.change > 0 ? "+" : ""}{kpi.change}%
                  </span>
                </div>
              )}

              {kpi.progress !== undefined && (
                <div className="mt-3">
                  <Progress value={kpi.progress} className="h-1.5" />
                  <span className="text-[10px] text-muted-foreground mt-1 block">{kpi.progress}% completo</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
