import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Rocket } from "lucide-react";
import { ReactNode } from "react";

interface WelcomeScreenProps {
  logo?: ReactNode;
  title: string;
  subtitle?: string;
  userName?: string;
  features?: { title: string; description: string }[];
  primaryCta: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  illustration?: ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function WelcomeScreen({
  logo,
  title,
  subtitle,
  userName,
  features,
  primaryCta,
  secondaryCta,
  illustration,
}: WelcomeScreenProps) {
  const displayTitle = userName ? title.replace("{name}", userName) : title;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-info/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-mesh opacity-30" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center max-w-2xl mx-auto px-6 py-16"
      >
        {logo && <motion.div variants={itemVariants} className="mb-8 flex justify-center">{logo}</motion.div>}

        <motion.div variants={itemVariants}>
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-3xl lg:text-4xl font-bold font-display tracking-tight"
        >
          {displayTitle}
        </motion.h1>

        {subtitle && (
          <motion.p variants={itemVariants} className="text-lg text-muted-foreground mt-4 max-w-md mx-auto">
            {subtitle}
          </motion.p>
        )}

        {features && (
          <motion.div variants={itemVariants} className="mt-8 space-y-3 text-left max-w-sm mx-auto">
            {features.map((f) => (
              <div key={f.title} className="flex gap-3 items-start p-3 rounded-xl bg-card border border-border">
                <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={primaryCta.onClick} className="h-12 px-8 gap-2 group text-base font-semibold">
            {primaryCta.label}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
          {secondaryCta && (
            <Button size="lg" variant="outline" onClick={secondaryCta.onClick} className="h-12 px-8 text-base">
              {secondaryCta.label}
            </Button>
          )}
        </motion.div>

        {illustration && (
          <motion.div variants={itemVariants} className="mt-12">
            {illustration}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
