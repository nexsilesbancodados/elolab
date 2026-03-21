import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface CTASectionProps {
  title: string;
  subtitle?: string;
  primaryCta: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  variant?: "default" | "gradient" | "dark" | "minimal" | "banner";
  features?: string[];
}

export function CTASection({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  variant = "gradient",
  features,
}: CTASectionProps) {
  const isDark = variant === "dark";
  const isGradient = variant === "gradient";
  const isBanner = variant === "banner";

  return (
    <section
      className={`relative overflow-hidden ${
        isBanner
          ? "py-10"
          : "py-20 lg:py-28"
      } ${
        isDark
          ? "bg-foreground text-background"
          : isGradient
          ? "bg-gradient-to-br from-primary/10 via-background to-info/5"
          : "bg-background"
      }`}
    >
      {/* Background effects */}
      {isGradient && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-info/8 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-mesh opacity-20" />
        </div>
      )}

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`text-center max-w-3xl mx-auto ${
            isBanner ? "" : "p-12 rounded-3xl"
          } ${
            isGradient && !isBanner ? "bg-card/50 backdrop-blur-sm border border-border/50 shadow-2xl" : ""
          }`}
        >
          <Sparkles className={`w-8 h-8 mx-auto mb-4 ${isDark ? "text-primary" : "text-primary"}`} />

          <h2 className={`text-3xl lg:text-4xl font-bold font-display tracking-tight ${isDark ? "" : ""}`}>
            {title}
          </h2>

          {subtitle && (
            <p className={`mt-4 text-lg ${isDark ? "text-background/70" : "text-muted-foreground"}`}>
              {subtitle}
            </p>
          )}

          {features && (
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {features.map((f) => (
                <span key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {f}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button
              size="lg"
              onClick={primaryCta.onClick}
              className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2 group"
            >
              {primaryCta.label}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            {secondaryCta && (
              <Button
                size="lg"
                variant={isDark ? "secondary" : "outline"}
                onClick={secondaryCta.onClick}
                className="h-12 px-8 text-base font-semibold"
              >
                {secondaryCta.label}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
