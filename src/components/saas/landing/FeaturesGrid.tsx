import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  color?: "primary" | "info" | "success" | "warning" | "destructive";
}

interface FeaturesGridProps {
  badge?: string;
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: "cards" | "minimal" | "icons" | "bordered" | "glass";
  header?: ReactNode;
}

const colorMap = {
  primary: "bg-primary/10 text-primary border-primary/20",
  info: "bg-info/10 text-info border-info/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

const iconBgMap = {
  primary: "bg-primary/10",
  info: "bg-info/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
};

const iconColorMap = {
  primary: "text-primary",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const colsMap = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" };

export function FeaturesGrid({
  badge,
  title,
  subtitle,
  features,
  columns = 3,
  variant = "cards",
}: FeaturesGridProps) {
  return (
    <section className="py-20 lg:py-28 bg-background relative">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          {badge && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              {badge}
            </span>
          )}
          <h2 className="text-3xl lg:text-4xl font-bold font-display tracking-tight">{title}</h2>
          {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
        </motion.div>

        {/* Grid */}
        <div className={`grid gap-6 ${colsMap[columns]}`}>
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const color = feature.color || "primary";

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`group relative p-6 rounded-2xl transition-all duration-300 ${
                  variant === "cards"
                    ? "bg-card border border-border hover:border-primary/20 hover:shadow-lg hover:-translate-y-1"
                    : variant === "glass"
                    ? "glass-card hover:shadow-lg hover:-translate-y-1"
                    : variant === "bordered"
                    ? "border-2 border-border hover:border-primary/30 bg-transparent"
                    : variant === "icons"
                    ? "text-center"
                    : "hover:bg-muted/50"
                }`}
              >
                {feature.badge && (
                  <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colorMap[color]}`}>
                    {feature.badge}
                  </span>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBgMap[color]} ${variant === "icons" ? "mx-auto" : ""}`}>
                  <Icon className={`w-6 h-6 ${iconColorMap[color]}`} />
                </div>

                <h3 className="text-lg font-semibold font-display mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
