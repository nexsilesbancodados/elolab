import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  content: string;
  rating?: number;
  highlight?: boolean;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
  variant?: "cards" | "carousel" | "masonry" | "featured" | "minimal";
  showRating?: boolean;
}

export function TestimonialsSection({
  title = "O que nossos clientes dizem",
  subtitle,
  testimonials,
  variant = "cards",
  showRating = true,
}: TestimonialsSectionProps) {
  const isMasonry = variant === "masonry";

  return (
    <section className="py-20 lg:py-28 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold font-display tracking-tight">{title}</h2>
          {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
        </motion.div>

        <div className={isMasonry ? "columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6" : "grid gap-6 md:grid-cols-2 lg:grid-cols-3"}>
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative p-6 rounded-2xl transition-all duration-300 ${
                isMasonry ? "break-inside-avoid" : ""
              } ${
                t.highlight
                  ? "bg-card border-2 border-primary/20 shadow-lg shadow-primary/5"
                  : variant === "minimal"
                  ? "bg-transparent"
                  : "bg-card border border-border hover:shadow-md"
              }`}
            >
              <Quote className="w-8 h-8 text-primary/15 absolute top-4 right-4" />

              {showRating && t.rating && (
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-4 h-4 ${starIdx < t.rating! ? "text-warning fill-warning" : "text-muted-foreground/20"}`}
                    />
                  ))}
                </div>
              )}

              <p className="text-sm leading-relaxed text-foreground/90 mb-6">
                "{t.content}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <Avatar className="w-10 h-10">
                  {t.avatar && <AvatarImage src={t.avatar} alt={t.name} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
