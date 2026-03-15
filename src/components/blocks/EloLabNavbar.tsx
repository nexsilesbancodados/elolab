import { useState } from "react";
import {
  Calendar, FileText, DollarSign, Bot, Shield, BarChart3,
  Stethoscope, Users, Heart, ClipboardList, Menu, LogIn,
  Zap, Mail, Phone, Smartphone, Monitor, Activity,
  ChevronRight, X, ArrowRight, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import logoIcon from "@/assets/logo-icon.png";

interface NavMenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: JSX.Element;
  items?: NavMenuItem[];
  onClick?: () => void;
}

interface EloLabNavbarProps {
  scrolled?: boolean;
  onScrollTo?: (id: string) => void;
}

const EloLabNavbar = ({ scrolled = false, onScrollTo }: EloLabNavbarProps) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    onScrollTo?.(id);
    setMobileOpen(false);
  };

  const menu: NavMenuItem[] = [
    {
      title: "Funcionalidades",
      url: "#features",
      items: [
        {
          title: "Agenda Inteligente",
          description: "Agendamento com recorrência e confirmação automática",
          icon: <Calendar className="size-5 shrink-0" />,
          url: "#features",
          onClick: () => scrollTo("features"),
        },
        {
          title: "Prontuário Eletrônico",
          description: "Histórico clínico centralizado com segurança LGPD",
          icon: <FileText className="size-5 shrink-0" />,
          url: "#features",
          onClick: () => scrollTo("features"),
        },
        {
          title: "Financeiro Completo",
          description: "Fluxo de caixa, contas a pagar/receber e relatórios",
          icon: <DollarSign className="size-5 shrink-0" />,
          url: "#features",
          onClick: () => scrollTo("features"),
        },
        {
          title: "IA no WhatsApp",
          description: "Agente inteligente 24h para agendamentos e respostas",
          icon: <Bot className="size-5 shrink-0" />,
          url: "#whatsapp-ai",
          onClick: () => scrollTo("whatsapp-ai"),
        },
      ],
    },
    {
      title: "Diferenciais",
      url: "#differentials",
      items: [
        {
          title: "LGPD Compliant",
          description: "Consentimento digital, criptografia e rastreabilidade",
          icon: <Shield className="size-5 shrink-0" />,
          url: "#differentials",
          onClick: () => scrollTo("differentials"),
        },
        {
          title: "Triagem Manchester",
          description: "Classificação de risco com protocolo internacional",
          icon: <Activity className="size-5 shrink-0" />,
          url: "#differentials",
          onClick: () => scrollTo("differentials"),
        },
        {
          title: "Painel TV",
          description: "Fila de atendimento em tempo real na recepção",
          icon: <Monitor className="size-5 shrink-0" />,
          url: "#differentials",
          onClick: () => scrollTo("differentials"),
        },
        {
          title: "Acesso Remoto",
          description: "Use no celular, tablet ou desktop em qualquer lugar",
          icon: <Smartphone className="size-5 shrink-0" />,
          url: "#differentials",
          onClick: () => scrollTo("differentials"),
        },
      ],
    },
    {
      title: "Como funciona",
      url: "#how-it-works",
      onClick: () => scrollTo("how-it-works"),
    },
    {
      title: "Depoimentos",
      url: "#testimonials",
      onClick: () => scrollTo("testimonials"),
    },
    {
      title: "Planos",
      url: "#pricing",
      onClick: () => scrollTo("pricing"),
    },
  ];

  const renderMenuItem = (item: NavMenuItem) => {
    if (item.items) {
      return (
        <NavigationMenuItem key={item.title}>
          <NavigationMenuTrigger
            className={`text-[13px] font-medium tracking-wide transition-all duration-200 rounded-full px-4 h-9 ${
              scrolled
                ? "text-foreground/70 hover:text-brand bg-transparent hover:bg-brand/5"
                : "text-white/75 hover:text-white bg-transparent hover:bg-white/10"
            }`}
          >
            {item.title}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-[340px] p-2">
              <NavigationMenuLink>
                {item.items.map((subItem) => (
                  <li key={subItem.title}>
                    <button
                      className="group flex w-full select-none gap-3.5 rounded-xl p-3 leading-none no-underline outline-none transition-all duration-200 hover:bg-brand/5 text-left"
                      onClick={subItem.onClick}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand group-hover:bg-brand/15 transition-colors">
                        {subItem.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors">
                          {subItem.title}
                        </div>
                        {subItem.description && (
                          <p className="text-xs leading-relaxed text-muted-foreground mt-0.5 line-clamp-2">
                            {subItem.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-brand/60 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                    </button>
                  </li>
                ))}
              </NavigationMenuLink>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      );
    }

    return (
      <button
        key={item.title}
        className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-medium tracking-wide transition-all duration-200 ${
          scrolled
            ? "text-foreground/70 hover:text-brand hover:bg-brand/5"
            : "text-white/75 hover:text-white hover:bg-white/10"
        }`}
        onClick={item.onClick}
      >
        {item.title}
      </button>
    );
  };

  const renderMobileMenuItem = (item: NavMenuItem) => {
    if (item.items) {
      return (
        <AccordionItem key={item.title} value={item.title} className="border-b border-border/50">
          <AccordionTrigger className="py-3.5 font-semibold hover:no-underline text-foreground text-[15px]">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-1">
              {item.items.map((subItem) => (
                <button
                  key={subItem.title}
                  className="group flex w-full select-none gap-3.5 rounded-xl p-3 leading-none outline-none transition-all hover:bg-brand/5 text-left"
                  onClick={subItem.onClick}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    {subItem.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{subItem.title}</div>
                    {subItem.description && (
                      <p className="text-xs leading-relaxed text-muted-foreground mt-0.5">
                        {subItem.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      );
    }

    return (
      <button
        key={item.title}
        onClick={item.onClick}
        className="w-full text-left py-3.5 font-semibold text-[15px] text-foreground border-b border-border/50 hover:text-brand transition-colors"
      >
        {item.title}
      </button>
    );
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-b border-border/30"
          : "bg-gradient-to-b from-black/20 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop */}
        <div className="hidden lg:flex items-center justify-between h-[68px]">
          <div className="flex items-center gap-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 group"
            >
              <img
                src={logoIcon}
                className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-105"
                alt="EloLab"
              />
              <span className="text-xl font-bold font-display tracking-tight">
                <span className={`transition-colors duration-300 ${scrolled ? "text-foreground" : "text-white"}`}>
                  ELO
                </span>
                <span className={`transition-colors duration-300 ${scrolled ? "text-brand" : "text-white/70"}`}>
                  LAB
                </span>
              </span>
            </button>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList className="gap-0.5">
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`font-medium rounded-full px-5 h-9 text-[13px] tracking-wide transition-all duration-200 ${
                scrolled
                  ? "text-foreground/70 hover:text-brand hover:bg-brand/5"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              onClick={() => navigate("/auth")}
            >
              <LogIn className="mr-1.5 h-4 w-4" /> Entrar
            </Button>
            <Button
              size="sm"
              className="bg-brand hover:bg-brand-hover text-brand-foreground font-semibold px-6 h-9 rounded-full shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all duration-300 hover:scale-[1.02] text-[13px] tracking-wide"
              onClick={() => scrollTo("pricing")}
            >
              Começar grátis
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex lg:hidden items-center justify-between h-16">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5"
          >
            <img src={logoIcon} className="h-9 w-9 object-contain" alt="EloLab" />
            <span className="text-xl font-bold font-display tracking-tight">
              <span className={scrolled ? "text-foreground" : "text-white"}>ELO</span>
              <span className={scrolled ? "text-brand" : "text-white/70"}>LAB</span>
            </span>
          </button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full h-10 w-10 ${
                  scrolled
                    ? "text-foreground hover:bg-muted"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md border-l-0 shadow-2xl">
              <SheetHeader>
                <SheetTitle>
                  <div className="flex items-center gap-2.5">
                    <img src={logoIcon} className="h-8 w-8 object-contain" alt="EloLab" />
                    <span className="text-lg font-bold font-display tracking-tight">
                      ELO<span className="text-brand">LAB</span>
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col">
                <Accordion
                  type="single"
                  collapsible
                  className="flex w-full flex-col"
                >
                  {menu.map((item) => renderMobileMenuItem(item))}
                </Accordion>

                {/* Quick links */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">
                    Links rápidos
                  </p>
                  <div className="space-y-1">
                    {[
                      { name: "Portal do Paciente", url: "/portal-paciente" },
                      { name: "FAQ", action: () => scrollTo("faq") },
                      { name: "contato@elolab.com.br", url: "mailto:contato@elolab.com.br" },
                    ].map((link, idx) => (
                      <button
                        key={idx}
                        className="flex w-full items-center h-10 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                        onClick={() => {
                          if (link.action) {
                            link.action();
                          } else if (link.url?.startsWith("/")) {
                            navigate(link.url);
                            setMobileOpen(false);
                          } else if (link.url) {
                            window.location.href = link.url;
                          }
                        }}
                      >
                        {link.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="mt-6 flex flex-col gap-2.5">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl border-brand/30 text-brand hover:bg-brand/5 font-semibold"
                    onClick={() => {
                      navigate("/auth");
                      setMobileOpen(false);
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" /> Entrar na plataforma
                  </Button>
                  <Button
                    className="h-12 rounded-xl bg-brand hover:bg-brand-hover text-brand-foreground font-semibold shadow-lg shadow-brand/20"
                    onClick={() => scrollTo("pricing")}
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Começar grátis
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export { EloLabNavbar };
