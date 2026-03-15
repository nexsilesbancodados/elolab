import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Loader2, Eye, EyeOff, Shield, ArrowLeft,
  Gift, CheckCircle2, Stethoscope, HeartPulse, BarChart3, Lock, Mail, User,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkRateLimit } from '@/lib/rateLimiter';
import { AuthSwitch } from '@/components/ui/auth-switch';
import logoIcon from '@/assets/logo-elolab-icon.png';

// ─── Schemas ───────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const signupSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a senha'),
  codigoConvite: z.string().min(1, 'Código de convite é obrigatório'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

// ─── Animations ────────────────────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -30 : 30, opacity: 0 }),
};

const features = [
  { icon: Stethoscope, title: 'Prontuário Eletrônico', desc: 'Registros clínicos completos' },
  { icon: HeartPulse, title: 'Agenda Inteligente', desc: 'Gestão de consultas integrada' },
  { icon: BarChart3, title: 'Financeiro', desc: 'Fluxo de caixa e faturamento' },
  { icon: Shield, title: 'LGPD', desc: 'Dados protegidos por padrão' },
];

// ─── Component ─────────────────────────────────────────────
export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, profile, isLoading: authLoading } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [direction, setDirection] = useState(0);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const urlCodigo = searchParams.get('codigo') || '';
  const urlEmail = searchParams.get('email') || '';

  useEffect(() => {
    if (urlCodigo) { setActiveTab('signup'); setDirection(1); }
  }, [urlCodigo]);

  useEffect(() => {
    if (!authLoading && user && profile) navigate('/dashboard');
  }, [user, profile, authLoading, navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: urlEmail || '', password: '' },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: '', email: urlEmail || '', password: '', confirmPassword: '',
      codigoConvite: urlCodigo || '',
    },
  });

  const handleTabChange = (tab: 'login' | 'signup') => {
    setDirection(tab === 'signup' ? 1 : -1);
    setActiveTab(tab);
  };

  const onLogin = async (data: LoginForm) => {
    const { allowed, retryAfterMs } = checkRateLimit('login', 'auth');
    if (!allowed) {
      toast.error(`Muitas tentativas. Tente em ${Math.ceil(retryAfterMs / 1000)}s.`);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) toast.error('Email ou senha incorretos');
        else if (error.message.includes('Email not confirmed')) toast.error('Confirme seu email antes de fazer login');
        else toast.error(error.message || 'Erro ao fazer login');
      } else {
        toast.success('Login realizado!');
        navigate('/dashboard');
      }
    } catch {
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const activateSubscription = async (userId: string, codigoConvite: string) => {
    try {
      const { data: registro, error: regError } = await supabase
        .from('registros_pendentes' as any)
        .select('*')
        .eq('codigo_convite', codigoConvite)
        .in('status', ['pendente', 'pago'])
        .single();

      if (regError || !registro) {
        toast.error('Código de convite inválido ou expirado.');
        return;
      }

      const reg = registro as any;
      if (new Date(reg.expires_at) < new Date()) {
        toast.error('Código de convite expirado.');
        return;
      }

      await supabase
        .from('registros_pendentes' as any)
        .update({ status: 'ativado', user_id: userId, activated_at: new Date().toISOString() })
        .eq('id', reg.id);

      if (reg.status === 'pago') {
        const { data: plano } = await supabase
          .from('planos' as any)
          .select('*')
          .eq('slug', reg.plano_slug)
          .single();

        if (plano) {
          const p = plano as any;
          await supabase
            .from('assinaturas_plano' as any)
            .insert({
              user_id: userId, plano_id: p.id, plano_slug: p.slug,
              status: 'ativa', em_trial: false, data_inicio: new Date().toISOString(),
            });
          toast.success(`Plano ${p.nome} ativado! 🎉`);
        }
      } else {
        const { data: result } = await supabase.rpc('start_free_trial' as any, {
          _user_id: userId, _plano_slug: reg.plano_slug,
        });
        const res = result as any;
        if (res?.success) toast.success(`Teste grátis ativado! ${res.plano_nome} por 3 dias. 🎉`);
      }
    } catch (err) {
      console.error('Erro ao ativar assinatura:', err);
    }
  };

  const onSignup = async (data: SignupForm) => {
    const { allowed, retryAfterMs } = checkRateLimit('signup', 'auth');
    if (!allowed) {
      toast.error(`Muitas tentativas. Tente em ${Math.ceil(retryAfterMs / 1000)}s.`);
      return;
    }
    setIsLoading(true);
    try {
      const { data: registro, error: regError } = await supabase
        .from('registros_pendentes' as any)
        .select('id, status, expires_at, plano_slug')
        .eq('codigo_convite', data.codigoConvite)
        .in('status', ['pendente', 'pago'])
        .single();

      if (regError || !registro) {
        toast.error('Código de convite inválido ou já utilizado.');
        setIsLoading(false);
        return;
      }

      const reg = registro as any;
      if (new Date(reg.expires_at) < new Date()) {
        toast.error('Código de convite expirado.');
        setIsLoading(false);
        return;
      }

      const result = await signUp(data.email, data.password, data.nome);
      if (result.error) {
        if (result.error.message.includes('User already registered')) toast.error('Este email já está cadastrado');
        else toast.error(result.error.message || 'Erro ao criar conta');
      } else {
        const userId = result.data?.user?.id;
        if (userId) await activateSubscription(userId, data.codigoConvite);
        setSignupSuccess(true);
        toast.success('Conta criada com sucesso!');
        signupForm.reset();
      }
    } catch {
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Loading state ───────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <img src={logoIcon} alt="EloLab" className="h-14 w-14 drop-shadow-lg" />
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-background">
      {/* ─── Left: Branding ─── */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.3)_0%,_transparent_70%)]" />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary-foreground)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-64 h-64 rounded-full bg-primary-foreground/5 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, -8, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 left-10 w-48 h-48 rounded-full bg-primary-foreground/8 blur-2xl"
        />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/10">
                <img src={logoIcon} alt="EloLab" className="h-8 w-8 drop-shadow-lg" />
              </div>
              <span className="text-xl font-extrabold font-display tracking-tight text-primary-foreground">
                EloLab
              </span>
            </div>
          </motion.div>

          {/* Center */}
          <div className="max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 text-primary-foreground/80 text-xs font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Sistema completo de gestão clínica
              </div>

              <h1 className="text-4xl xl:text-[2.75rem] font-extrabold font-display text-primary-foreground leading-[1.1] mb-4">
                Simplifique sua
                <br />
                <span className="text-primary-foreground/70">rotina clínica</span>
              </h1>

              <p className="text-primary-foreground/50 text-base leading-relaxed mb-10">
                Agenda, prontuário, financeiro e laboratório em uma única plataforma segura e intuitiva.
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-2 gap-3"
            >
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="group flex items-start gap-3 rounded-xl bg-primary-foreground/[0.06] backdrop-blur-sm border border-primary-foreground/[0.08] p-3.5 hover:bg-primary-foreground/[0.1] transition-all duration-300"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <f.icon className="h-4 w-4 text-primary-foreground/80" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary-foreground text-[13px] leading-tight">{f.title}</p>
                    <p className="text-primary-foreground/40 text-[11px] mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-6 text-primary-foreground/30 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>LGPD Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Criptografia end-to-end</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Right: Auth Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/[0.03] rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <img src={logoIcon} alt="EloLab" className="h-10 w-10 drop-shadow-md" />
              <span className="text-2xl font-extrabold font-display tracking-tight text-foreground">
                Elo<span className="text-primary">Lab</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">Gestão Clínica Inteligente</p>
          </div>

          {/* Invite banner */}
          <AnimatePresence>
            {urlCodigo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 bg-primary/5 border border-primary/15 rounded-xl flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Código detectado!</p>
                  <p className="text-xs text-muted-foreground">Preencha seus dados para ativar.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Heading */}
          <div className="mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold font-display text-foreground">
                  {activeTab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {activeTab === 'login'
                    ? 'Acesse o sistema com suas credenciais'
                    : 'Preencha os dados para começar'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Auth Switch */}
          <div className="mb-6">
            <AuthSwitch activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          {/* Form content */}
          <AnimatePresence mode="wait" custom={direction}>
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                              <Input
                                type="email"
                                placeholder="seu@email.com"
                                autoComplete="email"
                                className="h-11 pl-10 bg-muted/20 border-border/50 focus:border-primary focus:bg-card rounded-xl"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="h-11 pl-10 pr-10 bg-muted/20 border-border/50 focus:border-primary focus:bg-card rounded-xl"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword
                                  ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  : <Eye className="h-4 w-4 text-muted-foreground" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-11 font-bold rounded-xl text-sm shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : 'Entrar'}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {signupSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Alert className="border-primary/20 bg-primary/5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription>
                        Conta criada e plano ativado! Faça login para acessar.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : (
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-3.5">
                      <FormField
                        control={signupForm.control}
                        name="codigoConvite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-primary flex items-center gap-1.5">
                              <Gift className="h-3.5 w-3.5" /> Código de Convite
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="A1B2C3D4"
                                autoComplete="off"
                                className="h-11 bg-primary/5 border-primary/20 focus:border-primary rounded-xl font-mono text-center text-base tracking-widest uppercase"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Nome completo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input placeholder="Dr. João Silva" autoComplete="name" className="h-11 pl-10 bg-muted/20 border-border/50 focus:border-primary focus:bg-card rounded-xl" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input type="email" placeholder="seu@email.com" autoComplete="email" className="h-11 pl-10 bg-muted/20 border-border/50 focus:border-primary focus:bg-card rounded-xl" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="h-11 pl-10 pr-10 bg-muted/20 border-border/50 focus:border-primary focus:bg-card rounded-xl" {...field} />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Confirmar senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="h-11 pl-10 pr-10 bg-muted/20 border-border/50 focus:border-primary focus:bg-card rounded-xl" {...field} />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 font-bold rounded-xl text-sm shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 transition-all"
                        disabled={isLoading}
                      >
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : 'Criar conta e ativar'}
                      </Button>
                    </form>
                  </Form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 space-y-3">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao site
            </Link>
            <p className="text-center text-[11px] text-muted-foreground/60">
              © {new Date().getFullYear()} EloLab · Todos os direitos reservados
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
