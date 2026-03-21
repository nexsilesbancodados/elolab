import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterSectionProps {
  logo: ReactNode;
  description?: string;
  columns: FooterColumn[];
  socialLinks?: { icon: ReactNode; href: string; label: string }[];
  bottomText?: string;
  variant?: "default" | "minimal" | "centered" | "dark";
}

export function FooterSection({
  logo,
  description,
  columns,
  socialLinks,
  bottomText = `© ${new Date().getFullYear()} Todos os direitos reservados.`,
  variant = "default",
}: FooterSectionProps) {
  const isDark = variant === "dark";

  return (
    <footer className={`pt-16 pb-8 ${isDark ? "bg-foreground text-background" : "bg-muted/30 border-t border-border"}`}>
      <div className="container">
        {variant === "centered" ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">{logo}</div>
            {description && <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">{description}</p>}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-8">
              {columns.flatMap(col => col.links).map(link => (
                <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
            <div>
              <div className="mb-4">{logo}</div>
              {description && (
                <p className={`text-sm max-w-xs leading-relaxed ${isDark ? "text-background/60" : "text-muted-foreground"}`}>
                  {description}
                </p>
              )}
              {socialLinks && (
                <div className="flex gap-3 mt-6">
                  {socialLinks.map(social => (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        isDark
                          ? "bg-background/10 hover:bg-background/20 text-background/60 hover:text-background"
                          : "bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {columns.map(col => (
              <div key={col.title}>
                <h4 className={`text-sm font-semibold mb-4 ${isDark ? "text-background/80" : ""}`}>
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className={`text-sm transition-colors ${
                          isDark
                            ? "text-background/50 hover:text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <Separator className={`my-8 ${isDark ? "bg-background/10" : ""}`} />

        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${isDark ? "text-background/40" : "text-muted-foreground/60"}`}>
          <p>{bottomText}</p>
          <div className="flex gap-4">
            <a href="/termos" className="hover:text-foreground transition-colors">Termos de uso</a>
            <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="/cookies" className="hover:text-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
