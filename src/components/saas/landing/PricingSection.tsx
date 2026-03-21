import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Check, X, Sparkles, Zap, Crown } from "lucide-react";
import { useState, ReactNode } from "react";

interface PricingFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PricingFeature[];
  cta: string;
  popular?: boolean;
  icon?: ReactNode;
  color?: "primary" | "info" | "warning";
  badge?: string;
  onSelect?: () => void;
}

interface PricingSectionProps {
  title?: string;
  subtitle?: string;
  plans: PricingPlan[];
  currency?: string;
  variant?: "default" | "glass" | "gradient" | "minimal";
  faq?: { question: string; answer: string }[];
  guarantee?: string;
}

export function PricingSection({
  title = "Planos e preços",
  subtitle = "Escolha o plano ideal para o seu negócio",
  plans,
  currency = "R$",
  variant = "default",
  guarantee,
}: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);

  const planIcons: Record<string, ReactNode> = {
    primary: <Zap className="w-5 h-5" />,
    info: <Sparkles className="w-5 h-5" />,
    warning: <Crown className="w-5 h-5" />,
  };

  return (
    <section className="py-20 lg:py-28 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold font-display tracking-tight">{title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Mensal
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Anual
            </span>
            {isYearly && (
              <Badge className="bg-success/10 text-success border-success/20 ml-2">
                Economize 20%
              </Badge>
            )}
          </div>
        </motion.div>

        <div className={`grid gap-8 ${plans.length === 3 ? "lg:grid-cols-3" : plans.length === 2 ? "lg:grid-cols-2 max-w-4xl mx-auto" : "lg:grid-cols-4"}`}>
          {plans.map((plan, i) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const color = plan.color || "primary";

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
                  plan.popular
                    ? variant === "glass"
                      ? "glass-card border-primary/30 shadow-xl shadow-primary/10 scale-[1.03] z-10"
                      : variant === "gradient"
                      ? "bg-gradient-to-b from-primary/10 to-primary/5 border-2 border-primary/30 shadow-xl shadow-primary/10 scale-[1.03] z-10"
                      : "bg-card border-2 border-primary/30 shadow-xl shadow-primary/10 scale-[1.03] z-10"
                    : "bg-card border border-border hover:border-primary/20 hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 px-4 py-1">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Mais popular
                    </Badge>
                  </div>
                )}

                {plan.badge && !plan.popular && (
                  <div className="absolute -top-3 right-6">
                    <Badge variant="outline" className="bg-card">{plan.badge}</Badge>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}/10 text-${color}`}>
                      {plan.icon || planIcons[color]}
                    </div>
                    <h3 className="text-xl font-bold font-display">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">{currency}</span>
                    <motion.span
                      key={price}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl font-bold font-display"
                    >
                      {price.toLocaleString("pt-BR")}
                    </motion.span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  {isYearly && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cobrado {currency} {(price * 12).toLocaleString("pt-BR")} por ano
                    </p>
                  )}
                </div>

                <Button
                  onClick={plan.onSelect}
                  className={`w-full mb-6 ${
                    plan.popular
                      ? "shadow-lg shadow-primary/25 hover:shadow-xl"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature.text} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${feature.highlight ? "text-primary" : "text-success"}`} />
                      ) : (
                        <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground/60"} ${feature.highlight ? "font-medium" : ""}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {guarantee && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground mt-12"
          >
            {guarantee}
          </motion.p>
        )}
      </div>
    </section>
  );
}
