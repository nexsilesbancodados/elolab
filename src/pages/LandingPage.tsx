import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, FileText, Shield, BarChart3, Stethoscope,
  MessageSquare, Star, ArrowRight, Check,
  Smartphone, Zap, Lock, FlaskConical, Receipt,
  Menu, X, Phone, Mail, Clock, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import elolabLogo from '@/assets/elolab-logo.png';
import landingHero from '@/assets/landing-hero.webp';
import landingEfficiency from '@/assets/landing-efficiency.webp';
import landingNoshow from '@/assets/landing-noshow.webp';
import landingOnline from '@/assets/landing-online.webp';
import landingEhr from '@/assets/landing-ehr.webp';
import landingFinancial from '@/assets/landing-financial.webp';
import landingSupport from '@/assets/landing-support.webp';
import landingTestimonials from '@/assets/landing-testimonials.webp';

/* ─── Warm color tokens ─── */
const WARM = {
  coral: 'hsl(12, 76%, 61%)',
  peach: 'hsl(20, 80%, 92%)',
  cream: 'hsl(35, 60%, 96%)',
  sand: 'hsl(30, 30%, 93%)',
  dark: 'hsl(20, 25%, 18%)',
  text: 'hsl(20, 15%, 30%)',
  textLight: 'hsl(20, 10%, 50%)',
  mint: 'hsl(160, 45%, 50%)',
};

/* ─── FadeIn on scroll ─── */
const FadeIn = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Feature Section (alternating image/text) ─── */
interface FeatureSectionProps {
  title: string;
  titleHighlight: string;
  description: string;
  description2?: string;
  cta: string;
  image: string;
  imageAlt: string;
  reversed?: boolean;
  checkItems?: string[];
  hasOverlay?: boolean;
}

const FeatureSection = ({ title, titleHighlight, description, description2, cta, image, imageAlt, reversed, checkItems, hasOverlay }: FeatureSectionProps) => {
  const navigate = useNavigate();
  return (
    <section className={`relative py-20 md:py-28 ${hasOverlay ? 'bg-white/60 backdrop-blur-sm' : 'bg-white/40 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <FadeIn className={`flex justify-center ${reversed ? 'lg:order-2' : 'lg:order-1'}`}>
            <img
              src={image}
              alt={imageAlt}
              className="w-full max-w-[460px] rounded-3xl shadow-lg shadow-[hsl(20,50%,50%)]/10 hover:shadow-xl transition-shadow duration-500"
              loading="lazy"
            />
          </FadeIn>

          {/* Text */}
          <FadeIn className={`${reversed ? 'lg:order-1' : 'lg:order-2'}`} delay={0.15}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight" style={{ color: WARM.dark }}>
              {title}{' '}
              <span className="bg-gradient-to-r from-[hsl(12,76%,61%)] to-[hsl(30,80%,55%)] bg-clip-text text-transparent">
                {titleHighlight}
              </span>
            </h2>
            <p className="mt-5 leading-relaxed text-base md:text-lg" style={{ color: WARM.text }}>
              {description}
            </p>
            {description2 && (
              <p className="mt-3 leading-relaxed text-base md:text-lg" style={{ color: WARM.text }}>
                {description2}
              </p>
            )}
            {checkItems && (
              <ul className="mt-6 space-y-3">
                {checkItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium" style={{ color: WARM.dark }}>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(12,76%,61%)] to-[hsl(30,80%,55%)] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <Button
              onClick={() => navigate('/auth')}
              className="mt-8 rounded-full px-8 py-3 text-sm font-bold shadow-lg shadow-[hsl(12,76%,61%)]/25 hover:shadow-xl hover:shadow-[hsl(12,76%,61%)]/35 transition-all duration-300"
              style={{ background: `linear-gradient(135deg, ${WARM.coral}, hsl(30,80%,55%))`, color: 'white' }}
            >
              {cta}
            </Button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

/* ─── Testimonials Data ─── */
const testimonials = [
  { name: 'Dra. Mariana Silva', clinic: 'Clínica CardioVida - Cardiologia', text: 'Trabalho com o EloLab há quase dois anos! O atendimento é super top! O sistema se reinventa auxiliando na gestão da clínica e contribuindo com a produtividade. Indico!' },
  { name: 'Dr. Carlos Mendes', clinic: 'Clínica MedCenter - Clínico Geral', text: 'São nossos parceiros há mais de um ano. Equipe atenciosa e preocupada com o cliente. Suporte eficiente, que sempre resolve qualquer problema. O sistema nunca ficou inoperante.' },
  { name: 'Ana Paula Costa', clinic: 'Clínica EstéticaPrime - Estética', text: 'Sou cliente deles desde o início, a maior vantagem é o fácil acesso e prontidão de sua equipe técnica, fazem sempre possível para atender nossas solicitações.' },
  { name: 'Dr. Roberto Alves', clinic: 'Clínica OrthoPlus - Ortopedia', text: 'Equipe muito atenciosa, que está sempre disponível para auxiliar. Sistema muito prático e completo. Recomendo para qualquer clínica.' },
  { name: 'Dra. Fernanda Lima', clinic: 'Clínica DermaVita - Dermatologia', text: 'O sistema nos ajuda muito no dia-a-dia da empresa, tanto na parte operacional, como na estratégica. Financeiro integrado é um diferencial.' },
  { name: 'Dr. Henrique Souza', clinic: 'Clínica PediatraCare - Pediatria', text: 'Sistema de fácil interação, excelente ferramenta de gestão. O prontuário eletrônico é muito intuitivo e seguro.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [testimonialPage, setTestimonialPage] = useState(0);

  const testimonialsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / testimonialsPerPage);
  const currentTestimonials = testimonials.slice(
    testimonialPage * testimonialsPerPage,
    (testimonialPage + 1) * testimonialsPerPage
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* ═══ FIXED GRADIENT BACKGROUND ═══ */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            linear-gradient(
              160deg,
              hsl(35, 70%, 95%) 0%,
              hsl(20, 80%, 93%) 25%,
              hsl(12, 60%, 90%) 50%,
              hsl(30, 50%, 92%) 75%,
              hsl(160, 30%, 93%) 100%
            )
          `,
        }}
      />

      <div className="min-h-screen overflow-x-hidden font-sans">

        {/* ═══════════════ NAVBAR ═══════════════ */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-md shadow-[hsl(20,50%,50%)]/5'
            : 'bg-transparent'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
            <img src={elolabLogo} alt="EloLab" className="h-8 md:h-9 w-auto" loading="eager" />
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold" style={{ color: WARM.text }}>
              {[
                { id: 'recursos', label: 'Recursos' },
                { id: 'depoimentos', label: 'Depoimentos' },
              ].map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)} className="hover:opacity-70 transition-opacity">
                  {item.label}
                </button>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/auth')} className="font-semibold" style={{ color: WARM.text }}>
                Entrar
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="rounded-full px-6 font-bold shadow-md text-white border-0"
                style={{ background: `linear-gradient(135deg, ${WARM.coral}, hsl(30,80%,55%))` }}
              >
                Teste Grátis
              </Button>
            </div>
            <button className="md:hidden p-2" style={{ color: WARM.dark }} onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="md:hidden bg-white/95 backdrop-blur-xl border-t border-[hsl(20,30%,90%)] px-6 pb-6 space-y-1"
            >
              {['Recursos', 'Depoimentos'].map(label => (
                <button key={label} onClick={() => scrollTo(label.toLowerCase())} className="block w-full text-left py-3 text-sm font-semibold" style={{ color: WARM.text }}>
                  {label}
                </button>
              ))}
              <div className="pt-3 space-y-2">
                <Button variant="ghost" onClick={() => navigate('/auth')} className="w-full">Entrar</Button>
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full rounded-full font-bold text-white border-0"
                  style={{ background: `linear-gradient(135deg, ${WARM.coral}, hsl(30,80%,55%))` }}
                >
                  Teste Grátis
                </Button>
              </div>
            </motion.div>
          )}
        </nav>

        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative overflow-hidden pt-20">
          {/* Subtle overlay for hero */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 md:pb-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left — Text */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <span
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-6"
                  style={{ background: 'hsl(12, 76%, 61%, 0.12)', color: WARM.coral }}
                >
                  <Zap className="w-3.5 h-3.5" /> O melhor
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight" style={{ color: WARM.dark }}>
                  sistema de gestão{' '}
                  <span className="bg-gradient-to-r from-[hsl(12,76%,61%)] to-[hsl(30,80%,55%)] bg-clip-text text-transparent">
                    para sua clínica.
                  </span>
                </h1>
                <p className="mt-6 text-lg max-w-lg leading-relaxed" style={{ color: WARM.textLight }}>
                  Agenda inteligente, prontuário eletrônico, financeiro completo, WhatsApp IA e muito mais.{' '}
                  <strong style={{ color: WARM.dark }}>Tudo em um único sistema.</strong>
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Button
                    size="xl"
                    onClick={() => navigate('/auth')}
                    className="rounded-full px-10 text-base font-bold shadow-lg text-white border-0"
                    style={{
                      background: `linear-gradient(135deg, ${WARM.coral}, hsl(30,80%,55%))`,
                      boxShadow: '0 10px 30px -5px hsl(12, 76%, 61%, 0.35)',
                    }}
                  >
                    Quero começar agora
                  </Button>
                </div>
                <div className="mt-6 flex items-center gap-5 text-xs font-medium" style={{ color: WARM.textLight }}>
                  <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> LGPD</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 3 dias grátis</span>
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 100% seguro</span>
                </div>
              </motion.div>

              {/* Right — Dashboard Image */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.2 }}
                className="flex justify-center lg:justify-end"
              >
                <img
                  src={landingHero}
                  alt="EloLab - Dashboard de gestão clínica"
                  className="w-full max-w-[560px] rounded-3xl shadow-2xl shadow-[hsl(20,50%,40%)]/15"
                  loading="eager"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════ FEATURE SECTIONS (Alternating) ═══════════════ */}
        <div id="recursos">
          <FeatureSection
            title="Aumente a eficiência"
            titleHighlight="da sua clínica"
            description="Potencialize seus resultados com um sistema que organiza e facilita os processos operacionais e de gestão da sua clínica."
            description2="Conte com recursos de automação e integração especialmente pensados para transformar o dia-a-dia do seu negócio."
            cta="Quero descomplicar minha clínica"
            image={landingEfficiency}
            imageAlt="Gestão eficiente de clínica"
            reversed={false}
          />

          <FeatureSection
            title="Reduza as faltas dos"
            titleHighlight="pacientes às consultas"
            description="Com a confirmação automática de consultas via WhatsApp, o sistema se encarrega de efetuar os envios das mensagens e destacar automaticamente na agenda da clínica as confirmações recebidas."
            description2="Ganhe produtividade permitindo que sua equipe foque em contatar e reagendar apenas aqueles pacientes que não confirmaram."
            cta="Quero reduzir o número de faltas"
            image={landingNoshow}
            imageAlt="Redução de faltas com WhatsApp"
            reversed={true}
            hasOverlay
          />

          <FeatureSection
            title="Aumente suas receitas com o"
            titleHighlight="Agendamento Online"
            description="Disponibilize o agendamento online do EloLab integrado ao site da sua clínica e através de campanhas nas redes sociais e potencialize a marcação de consultas por seus pacientes."
            description2="Conte com o EloLab para diversificar seus canais de agendamento e captar mais pacientes."
            cta="Quero disponibilizar o agendamento online"
            image={landingOnline}
            imageAlt="Agendamento online"
            reversed={false}
          />

          <FeatureSection
            title="Prontuário eletrônico"
            titleHighlight="personalizável"
            description="Com o prontuário eletrônico do EloLab você transforma os atendimentos de sua clínica. É possível pré-configurar modelos de anamnese, consultar histórico de atendimentos, anexar imagens e documentos, prescrever medicamentos, solicitar exames, emitir atestados e muito mais."
            description2="Tudo isso de forma segura, com assinatura digital e conformidade LGPD."
            cta="Quero utilizar prontuário eletrônico"
            image={landingEhr}
            imageAlt="Prontuário eletrônico"
            reversed={true}
            hasOverlay
          />

          <FeatureSection
            title="Controle financeiro"
            titleHighlight="seguro e eficiente"
            description="Ganhe tempo e tranquilidade com um controle financeiro realmente completo, seguro e eficiente para sua clínica. Tenha acesso rápido aos resultados diários em dashboards e acompanhe detalhes em relatórios."
            description2="Evite fraudes rastreando qualquer lançamento ou alteração realizados no financeiro. Organize seu contas a pagar e acompanhe seu fluxo de caixa futuro para garantir a saúde financeira da sua clínica."
            cta="Quero um financeiro seguro"
            image={landingFinancial}
            imageAlt="Controle financeiro"
            reversed={false}
          />

          <FeatureSection
            title="Pós-venda comprometido com o"
            titleHighlight="sucesso do cliente"
            description="Conte com nosso time de especialistas para capacitar sua equipe com foco em uma utilização correta e eficiente do sistema."
            cta="Quero começar agora"
            image={landingSupport}
            imageAlt="Suporte ao cliente"
            reversed={true}
            hasOverlay
            checkItems={[
              'Treinamentos com nosso time de especialistas.',
              'Migração de cadastros do seu sistema atual.',
              'Suporte em tempo real através de chat.',
            ]}
          />
        </div>

        {/* ═══════════════ TESTIMONIALS ═══════════════ */}
        <section id="depoimentos" className="py-20 md:py-28 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start">
              {/* Left title + image */}
              <FadeIn>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight" style={{ color: WARM.dark }}>
                  O que estão falando sobre o{' '}
                  <span className="bg-gradient-to-r from-[hsl(12,76%,61%)] to-[hsl(30,80%,55%)] bg-clip-text text-transparent">
                    EloLab?
                  </span>
                </h2>
                <img
                  src={landingTestimonials}
                  alt="Depoimentos"
                  className="mt-8 w-full max-w-[280px] rounded-2xl hidden lg:block"
                  loading="lazy"
                />
              </FadeIn>

              {/* Right testimonials grid */}
              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={testimonialPage}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4 }}
                    className="grid sm:grid-cols-3 gap-5"
                  >
                    {currentTestimonials.map((t, i) => (
                      <div
                        key={i}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-[hsl(20,30%,90%)] flex flex-col hover:shadow-md hover:shadow-[hsl(12,50%,60%)]/10 transition-all duration-300"
                      >
                        <p className="font-bold text-sm" style={{ color: WARM.dark }}>{t.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: WARM.textLight }}>{t.clinic}</p>
                        <div className="flex gap-0.5 mt-3">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className="w-4 h-4 fill-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]" />
                          ))}
                        </div>
                        <div className="mt-4 text-4xl font-serif leading-none bg-gradient-to-r from-[hsl(12,76%,61%)] to-[hsl(30,80%,55%)] bg-clip-text text-transparent opacity-30">
                          "
                        </div>
                        <p className="text-sm leading-relaxed flex-1 -mt-2" style={{ color: WARM.text }}>
                          {t.text}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Pagination dots */}
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialPage(i)}
                      className="h-3 rounded-full transition-all duration-300"
                      style={{
                        width: testimonialPage === i ? '2rem' : '0.75rem',
                        background: testimonialPage === i
                          ? `linear-gradient(135deg, ${WARM.coral}, hsl(30,80%,55%))`
                          : 'hsl(20, 15%, 82%)',
                      }}
                      aria-label={`Página ${i + 1} de depoimentos`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <section className="py-20 md:py-28 bg-white/40 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: WARM.dark }}>
                Pronto para transformar sua clínica?
              </h2>
              <p className="mt-4 text-lg" style={{ color: WARM.textLight }}>
                Comece agora com 3 dias grátis. Sem cartão de crédito. Sem compromisso.
              </p>
              <Button
                size="xl"
                onClick={() => navigate('/auth')}
                className="mt-10 rounded-full px-10 text-base font-bold text-white border-0"
                style={{
                  background: `linear-gradient(135deg, ${WARM.coral}, hsl(30,80%,55%))`,
                  boxShadow: '0 10px 30px -5px hsl(12, 76%, 61%, 0.35)',
                }}
              >
                Quero começar agora <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </FadeIn>
          </div>
        </section>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <footer style={{ background: WARM.dark }} className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <img src={elolabLogo} alt="EloLab" className="h-8 w-auto brightness-0 invert mb-4" loading="lazy" />
                <p className="text-sm text-white/50 leading-relaxed">
                  Sistema completo de gestão para clínicas médicas e laboratórios.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white mb-4">Produto</h4>
                <ul className="space-y-2 text-sm text-white/50">
                  <li><button onClick={() => scrollTo('recursos')} className="hover:text-white transition-colors">Recursos</button></li>
                  <li><button onClick={() => scrollTo('depoimentos')} className="hover:text-white transition-colors">Depoimentos</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-white/50">
                  <li><a href="/politica-privacidade" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                  <li><a href="/politica-cookies" className="hover:text-white transition-colors">Política de Cookies</a></li>
                  <li><a href="/termos-uso" className="hover:text-white transition-colors">Termos de Uso</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white mb-4">Contato</h4>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> suporte@elolab.com.br</li>
                  <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> (11) 9999-9999</li>
                </ul>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-white/30">© {new Date().getFullYear()} EloLab. Todos os direitos reservados.</p>
              <p className="text-xs text-white/30">CNPJ: 00.000.000/0001-00</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
