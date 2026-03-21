import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, CheckCircle2 } from "lucide-react";
import { ReactNode } from "react";

interface HeroSectionProps {
  badge?: string;
  title: string;
  titleHighlight?: string;
  subtitle: string;
  primaryCta?: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  features?: string[];
  image?: ReactNode;
  variant?: "default" | "centered" | "split" | "gradient" | "video";
  showTrustedBy?: boolean;
  trustedLogos?: ReactNode[];
  stats?: { value: string; label: string }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroSection({
  badge,
  title,
  titleHighlight,
  subtitle,
  primaryCta,
  secondaryCta,
  features,
  image,
  variant = "default",
  showTrustedBy,
  trustedLogos,
  stats,
}: HeroSectionProps) {
  const isCentered = variant === "centered";
  const isSplit = variant === "split";
  const isGradient = variant === "gradient";

  return (
    <section className={`relative overflow-hidden ${isGradient ? "bg-gradient-to-br from-background via-background to-primary/5" : "bg-background"}`}>
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-info/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-mesh opacity-40" />
      </div>

      <div className={`container relative z-10 py-20 lg:py-32 ${isSplit ? "grid lg:grid-cols-2 gap-12 items-center" : ""}`}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={isCentered ? "text-center max-w-4xl mx-auto" : "max-w-2xl"}
        >
          {badge && (
            <motion.div variants={itemVariants}>
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-medium border-primary/30 bg-primary/5 text-primary gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                {badge}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold font-display tracking-tight leading-[1.08]"
          >
            {title}{" "}
            {titleHighlight && (
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {titleHighlight}
              </span>
            )}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl"
          >
            {subtitle}
          </motion.p>

          {features && features.length > 0 && (
            <motion.div variants={itemVariants} className="mt-6 flex flex-wrap gap-3">
              {features.map((feat) => (
                <span key={feat} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {feat}
                </span>
              ))}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className={`mt-8 flex flex-wrap gap-4 ${isCentered ? "justify-center" : ""}`}>
            {primaryCta && (
              <Button
                size="lg"
                onClick={primaryCta.onClick}
                className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2 group"
              >
                {primaryCta.label}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
            {secondaryCta && (
              <Button
                size="lg"
                variant="outline"
                onClick={secondaryCta.onClick}
                className="h-12 px-8 text-base font-semibold gap-2"
              >
                {variant === "video" ? <Play className="w-4 h-4" /> : null}
                {secondaryCta.label}
              </Button>
            )}
          </motion.div>

          {stats && stats.length > 0 && (
            <motion.div
              variants={itemVariants}
              className={`mt-12 flex gap-8 ${isCentered ? "justify-center" : ""}`}
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold font-display text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {showTrustedBy && trustedLogos && (
            <motion.div variants={itemVariants} className="mt-16">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-6 font-medium">
                Utilizado por empresas líderes
              </p>
              <div className="flex flex-wrap items-center gap-8 opacity-50">
                {trustedLogos.map((logo, i) => (
                  <div key={i}>{logo}</div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {isSplit && image && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-info/10 rounded-2xl blur-2xl -z-10" />
            {image}
          </motion.div>
        )}
      </div>
    </section>
  );
}
