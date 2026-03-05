import {
  Calendar, FileText, DollarSign, Bot, Shield, BarChart3,
  Stethoscope, Users, Heart, ClipboardList, Menu, LogIn,
  Zap, Mail, Phone, Smartphone, Monitor, Activity,
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

import logoInovalab from "@/assets/logo-inovalab.jpeg";

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

  const scrollTo = (id: string) => {
    onScrollTo?.(id);
  };

  const menu: NavMenuItem[] = [
    {
      title: "Funcionalidades",
      url: "#features",
      items: [
        {
          title: "Agenda Inteligente",
          description: "Agendamento online com recorrência e confirmação automática",
          icon: <Calendar className="size-5 shrink-0 text-[hsl(200,80%,50%)]" />,
          url: "#features",
          onClick: () => scrollTo("features"),
        },
        {
          title: "Prontuário Eletrônico",
          description: "Histórico clínico centralizado com segurança LGPD",
          icon: <FileText className="size-5 shrink-0 text-[hsl(168,76%,36%)]" />,
          url: "#features",
          onClick: () => scrollTo("features"),
        },
        {
          title: "Financeiro Completo",
          description: "Fluxo de caixa, contas a pagar/receber e relatórios",
          icon: <DollarSign className="size-5 shrink-0 text-[hsl(38,92%,50%)]" />,
          url: "#features",
          onClick: () => scrollTo("features"),
        },
        {
          title: "IA no WhatsApp",
          description: "Agente inteligente 24h para agendamentos e respostas",
          icon: <Bot className="size-5 shrink-0 text-[hsl(142,70%,35%)]" />,
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
          icon: <Shield className="size-5 shrink-0 text-[hsl(168,76%,36%)]" />,
          url: "#differentials",
          onClick: () => scrollTo("differentials"),
        },
        {
          title: "Triagem Manchester",
          description: "Classificação de risco com protocolo internacional",
          icon: <Activity className="size-5 shrink-0 text-[hsl(0,72%,51%)]" />,
          url: "#differentials",
          onClick: () => scrollTo("differentials"),
        },
        {
          title: "Painel TV",
          description: "Fila de atendimento em tempo real na recepção",
          icon: <Monitor className="size-5 shrink-0 text-[hsl(200,80%,50%)]" />,
          url: "#differentials",
          onClick: () => scrollTo("differentials"),
        },
        {
          title: "Acesso Remoto",
          description: "Use no celular, tablet ou desktop em qualquer lugar",
          icon: <Smartphone className="size-5 shrink-0 text-[hsl(280,65%,55%)]" />,
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

  const mobileExtraLinks = [
    { name: "Portal do Paciente", url: "/portal-paciente" },
    { name: "Aceitar Convite", url: "/aceitar-convite" },
    { name: "FAQ", url: "#faq" },
    { name: "contato@elolab.com.br", url: "mailto:contato@elolab.com.br" },
  ];

  const renderMenuItem = (item: NavMenuItem) => {
    if (item.items) {
      return (
        <NavigationMenuItem key={item.title}>
          <NavigationMenuTrigger
            className={`text-sm font-medium transition-colors ${
              scrolled
                ? "text-[hsl(215,15%,45%)] hover:text-[hsl(168,76%,36%)] bg-transparent hover:bg-[hsl(168,76%,96%)]"
                : "text-white/80 hover:text-white bg-transparent hover:bg-white/10"
            }`}
          >
            {item.title}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-80 p-3">
              <NavigationMenuLink>
                {item.items.map((subItem) => (
                  <li key={subItem.title}>
                    <button
                      className="flex w-full select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[hsl(168,76%,96%)] text-left"
                      onClick={subItem.onClick}
                    >
                      {subItem.icon}
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {subItem.title}
                        </div>
                        {subItem.description && (
                          <p className="text-sm leading-snug text-muted-foreground mt-0.5">
                            {subItem.description}
                          </p>
                        )}
                      </div>
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
        className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          scrolled
            ? "text-[hsl(215,15%,45%)] hover:text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,96%)]"
            : "text-white/80 hover:text-white hover:bg-white/10"
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
        <AccordionItem key={item.title} value={item.title} className="border-b-0">
          <AccordionTrigger className="py-0 font-semibold hover:no-underline text-foreground">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="mt-2">
            {item.items.map((subItem) => (
              <button
                key={subItem.title}
                className="flex w-full select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-[hsl(168,76%,96%)] text-left"
                onClick={subItem.onClick}
              >
                {subItem.icon}
                <div>
                  <div className="text-sm font-semibold">{subItem.title}</div>
                  {subItem.description && (
                    <p className="text-sm leading-snug text-muted-foreground">
                      {subItem.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </AccordionContent>
        </AccordionItem>
      );
    }

    return (
      <button
        key={item.title}
        onClick={item.onClick}
        className="font-semibold text-left text-foreground"
      >
        {item.title}
      </button>
    );
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-[hsl(220,13%,91%)]/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop */}
        <div className="hidden lg:flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5"
            >
              <img src={logoInovalab} className="h-9 w-9 rounded-lg object-contain" alt="EloLab" />
              <span className="text-[22px] font-extrabold font-display tracking-tight">
                <span className={scrolled ? "text-[hsl(215,28%,17%)]" : "text-white"}>
                  ELO
                </span>
                <span className="text-[hsl(168,76%,36%)]">LAB</span>
              </span>
            </button>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              className={`font-semibold ${
                scrolled
                  ? "text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,96%)]"
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => navigate("/auth")}
            >
              <LogIn className="mr-1.5 h-4 w-4" /> Entrar
            </Button>
            <Button
              size="sm"
              className="bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white shadow-lg shadow-[hsl(168,76%,36%)]/25 font-semibold px-5 rounded-lg"
              onClick={() => scrollTo("pricing")}
            >
              Começar grátis
            </Button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex lg:hidden items-center justify-between h-[72px]">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5"
          >
            <img src={logoInovalab} className="h-9 w-9 rounded-lg object-contain" alt="EloLab" />
            <span className="text-[22px] font-extrabold font-display tracking-tight">
              <span className={scrolled ? "text-[hsl(215,28%,17%)]" : "text-white"}>ELO</span>
              <span className="text-[hsl(168,76%,36%)]">LAB</span>
            </span>
          </button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={scrolled ? "" : "border-white/20 text-white hover:bg-white/10"}
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <div className="flex items-center gap-2.5">
                    <img src={logoInovalab} className="h-8 w-8 rounded-lg object-contain" alt="EloLab" />
                    <span className="text-lg font-extrabold font-display tracking-tight">
                      ELO<span className="text-[hsl(168,76%,36%)]">LAB</span>
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="my-6 flex flex-col gap-6">
                <Accordion
                  type="single"
                  collapsible
                  className="flex w-full flex-col gap-4"
                >
                  {menu.map((item) => renderMobileMenuItem(item))}
                </Accordion>
                <div className="border-t border-[hsl(220,13%,93%)] py-4">
                  <div className="grid grid-cols-2 justify-start">
                    {mobileExtraLinks.map((link, idx) => (
                      <a
                        key={idx}
                        className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-[hsl(168,76%,96%)]"
                        href={link.url}
                        onClick={(e) => {
                          if (link.url.startsWith("#")) {
                            e.preventDefault();
                            scrollTo(link.url.replace("#", ""));
                          } else if (link.url.startsWith("/")) {
                            e.preventDefault();
                            navigate(link.url);
                          }
                        }}
                      >
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="border-[hsl(168,76%,36%)] text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,96%)]"
                    onClick={() => navigate("/auth")}
                  >
                    <LogIn className="mr-2 h-4 w-4" /> Entrar
                  </Button>
                  <Button
                    className="bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white font-bold shadow-lg shadow-[hsl(168,76%,36%)]/20"
                    onClick={() => scrollTo("pricing")}
                  >
                    Começar grátis
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
