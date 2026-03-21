import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Stat {
  value: string;
  label: string;
  suffix?: string;
  icon?: LucideIcon;
  description?: string;
}

interface StatsSectionProps {
  title?: string;
  subtitle?: string;
  stats: Stat[];
  variant?: "default" | "cards" | "inline" | "gradient" | "minimal";
}

export function StatsSection({
  title,
  subtitle,
  stats,
  variant = "default",
}: StatsSectionProps) {
  return (
    <section className={`py-16 lg:py-24 relative ${variant === "gradient" ? "bg-gradient-to-r from-primary/5 to-info/5" : "bg-background"}`}>
      <div className="container">
        {title && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold font-display tracking-tight">{title}</h2>
            {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
          </motion.div>
        )}

        <div className={`grid gap-8 ${
          stats.length === 4 ? "grid-cols-2 lg:grid-cols-4" :
          stats.length === 3 ? "grid-cols-1 md:grid-cols-3" :
          "grid-cols-2"
        }`}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`text-center ${
                  variant === "cards"
                    ? "p-8 rounded-2xl bg-card border border-border hover:shadow-md transition-shadow"
                    : variant === "inline"
                    ? "flex items-center gap-4 text-left"
                    : ""
                }`}
              >
                {Icon && (
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 mb-4 ${variant === "inline" ? "mb-0" : "mx-auto"}`}>
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <div className="text-3xl lg:text-4xl font-bold font-display tracking-tight">
                    {stat.value}
                    {stat.suffix && <span className="text-primary text-2xl">{stat.suffix}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
                  {stat.description && <p className="text-xs text-muted-foreground/70 mt-1">{stat.description}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
