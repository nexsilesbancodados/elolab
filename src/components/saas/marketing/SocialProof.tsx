import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface SocialProofProps {
  variant?: "avatars" | "rating" | "counter" | "logos" | "combined";
  avatars?: { src?: string; name: string }[];
  rating?: number;
  reviewCount?: number;
  userCount?: string;
  label?: string;
  logos?: { src: string; alt: string }[];
  className?: string;
}

export function SocialProof({
  variant = "combined",
  avatars,
  rating = 4.9,
  reviewCount,
  userCount,
  label,
  logos,
  className = "",
}: SocialProofProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`flex flex-wrap items-center gap-4 ${className}`}
    >
      {/* Avatar stack */}
      {(variant === "avatars" || variant === "combined") && avatars && (
        <div className="flex -space-x-2">
          {avatars.slice(0, 5).map((a, i) => (
            <Avatar key={i} className="w-8 h-8 border-2 border-background">
              {a.src && <AvatarImage src={a.src} />}
              <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                {a.name[0]}
              </AvatarFallback>
            </Avatar>
          ))}
          {avatars.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 border-background bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
              +{avatars.length - 5}
            </div>
          )}
        </div>
      )}

      {/* Rating */}
      {(variant === "rating" || variant === "combined") && (
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? "text-warning fill-warning" : "text-muted-foreground/20"}`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold">{rating}</span>
          {reviewCount && <span className="text-xs text-muted-foreground">({reviewCount.toLocaleString("pt-BR")} avaliações)</span>}
        </div>
      )}

      {/* Counter */}
      {(variant === "counter" || variant === "combined") && userCount && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold">{userCount}</span>
          <span className="text-sm text-muted-foreground">{label || "usuários ativos"}</span>
        </div>
      )}

      {/* Logos */}
      {variant === "logos" && logos && (
        <div className="flex flex-wrap items-center gap-8">
          {logos.map((logo) => (
            <img
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              className="h-6 opacity-40 hover:opacity-70 transition-opacity grayscale"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
