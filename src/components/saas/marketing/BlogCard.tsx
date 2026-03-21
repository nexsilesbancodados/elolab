import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, ArrowRight } from "lucide-react";

interface BlogCardProps {
  title: string;
  excerpt: string;
  image?: string;
  category?: string;
  author: { name: string; avatar?: string };
  date: string;
  readTime?: string;
  href?: string;
  variant?: "default" | "horizontal" | "featured" | "minimal";
  index?: number;
}

export function BlogCard({
  title,
  excerpt,
  image,
  category,
  author,
  date,
  readTime,
  href = "#",
  variant = "default",
  index = 0,
}: BlogCardProps) {
  const isFeatured = variant === "featured";
  const isHorizontal = variant === "horizontal";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group ${
        isHorizontal
          ? "flex gap-6 items-start"
          : isFeatured
          ? "md:col-span-2 grid md:grid-cols-2 gap-6 items-center"
          : ""
      }`}
    >
      {/* Image */}
      {image && (
        <a
          href={href}
          className={`block overflow-hidden rounded-xl bg-muted ${
            isHorizontal ? "w-48 h-32 shrink-0" : isFeatured ? "aspect-[16/10]" : "aspect-[16/9] mb-4"
          }`}
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </a>
      )}

      {!image && !isHorizontal && (
        <div className={`rounded-xl bg-gradient-to-br from-primary/10 to-info/10 ${isFeatured ? "aspect-[16/10]" : "aspect-[16/9] mb-4"}`} />
      )}

      {/* Content */}
      <div className={`flex-1 ${isFeatured ? "py-4" : ""}`}>
        {category && (
          <Badge variant="outline" className="mb-3 bg-primary/5 text-primary border-primary/20 text-[10px]">
            {category}
          </Badge>
        )}

        <a href={href}>
          <h3 className={`font-bold font-display leading-tight group-hover:text-primary transition-colors ${
            isFeatured ? "text-2xl" : isHorizontal ? "text-base" : "text-lg"
          }`}>
            {title}
          </h3>
        </a>

        <p className={`text-muted-foreground mt-2 leading-relaxed ${
          isFeatured ? "text-base" : "text-sm"
        } ${isHorizontal ? "truncate-2" : "truncate-3"}`}>
          {excerpt}
        </p>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-7 h-7">
              {author.avatar && <AvatarImage src={author.avatar} />}
              <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                {author.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{author.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date}
            </span>
            {readTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {readTime}
              </span>
            )}
          </div>
        </div>

        {isFeatured && (
          <a href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4 group/link">
            Ler mais
            <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
          </a>
        )}
      </div>
    </motion.article>
  );
}
