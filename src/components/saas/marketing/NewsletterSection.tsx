import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface NewsletterSectionProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  variant?: "default" | "inline" | "card" | "banner";
  features?: string[];
  onSubscribe?: (email: string) => void;
}

export function NewsletterSection({
  title = "Fique por dentro",
  subtitle = "Receba as últimas novidades e atualizações no seu e-mail.",
  placeholder = "seu@email.com",
  buttonText = "Inscrever-se",
  successMessage = "Obrigado! Você foi inscrito com sucesso.",
  variant = "default",
  features,
  onSubscribe,
}: NewsletterSectionProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSubscribe?.(email);
      setSubscribed(true);
    }
  };

  if (subscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-8 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-success" />
        </div>
        <p className="text-sm font-medium">{successMessage}</p>
      </motion.div>
    );
  }

  const isInline = variant === "inline";
  const isBanner = variant === "banner";

  return (
    <section className={`${isBanner ? "bg-primary/5 border-y border-primary/10 py-8" : variant === "card" ? "rounded-2xl border border-border bg-card p-8" : "py-16"}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`${isBanner ? "container flex items-center justify-between gap-8" : isInline ? "flex items-center gap-6" : "text-center max-w-lg mx-auto"}`}
      >
        <div className={isBanner || isInline ? "flex-1" : ""}>
          <div className={`flex items-center gap-2 ${!isBanner && !isInline ? "justify-center mb-4" : "mb-2"}`}>
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold font-display">{title}</h3>
          </div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {features && (
            <div className="flex flex-wrap gap-3 mt-3">
              {features.map(f => (
                <span key={f} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className={`flex gap-2 ${isBanner || isInline ? "shrink-0" : "mt-6 max-w-md mx-auto"}`}
        >
          <Input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="min-w-[240px]"
            required
          />
          <Button type="submit" className="gap-2 shrink-0">
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </section>
  );
}
