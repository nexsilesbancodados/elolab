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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Eye, EyeOff, Shield, Clock, Users, ArrowLeft,
  Gift, CheckCircle2, Stethoscope, HeartPulse, BarChart3, Lock, Mail, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkRateLimit } from '@/lib/rateLimiter';
import { cn } from '@/lib/utils';
import logoIcon from '@/assets/logo-elolab-icon.png';
import logoFull from '@/assets/logo-elolab-full.png';

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

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const features = [
  { icon: Stethoscope, title: 'Prontuário Eletrônico', desc: 'Registros clínicos completos e seguros' },
  { icon: HeartPulse, title: 'Agenda Inteligente', desc: 'Gestão de consultas e bloqueios' },
  { icon: BarChart3, title: 'Financeiro Integrado', desc: 'Fluxo de caixa e faturamento' },
  { icon: Shield, title: 'LGPD Compliant', desc: 'Dados protegidos por padrão' },
];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, profile, isLoading: authLoading } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const urlCodigo = searchParams.get('codigo') || '';
  const urlEmail = searchParams.get('email') || '';

  useEffect(() => {
    if (urlCodigo) setActiveTab('signup');
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

  const onLogin = async (data: LoginForm) => {
    const { allowed, retryAfterMs } = checkRateLimit('login', 'auth');
    if (!allowed) {
      toast.error(`Muitas tentativas. Tente novamente em ${Math.ceil(retryAfterMs / 1000)}s.`);
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
        toast.success('Login realizado com sucesso!');
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
          toast.success(`Plano ${p.nome} ativado com sucesso! 🎉`);
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
      toast.error(`Muitas tentativas. Tente novamente em ${Math.ceil(retryAfterMs / 1000)}s.`);
      return;
    }
    setIsLoading(true);
    try {
      const { data: registro, error: regError } = await supabase
        .from('registros_pendentes' as string & keyof Database['public']['Tables'])
        .select('id, status, expires_at, plano_slug')
        .eq('codigo_convite', data.codigoConvite)
        .in('status', ['pendente', 'pago'])
        .single();

      if (regError || !registro) {
        toast.error('Código de convite inválido ou já utilizado.');
        setIsLoading(false);
        return;
      }

      const reg = registro as Record<string, unknown>;
      if (new Date(reg.expires_at as string) < new Date()) {
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <img src={logoIcon} alt="EloLab" className="h-16 w-16 drop-shadow-lg" />
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ─── Left Panel: Branding ─── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-foreground">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-primary/20" />

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="EloLab" className="h-10 w-10 drop-shadow-lg" />
              <span className="text-xl font-extrabold font-display tracking-tight text-background">
                Elo<span className="text-primary">Lab</span>
              </span>
            </div>
          </motion.div>

          {/* Center content */}
          <motion.div
            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="max-w-lg"
          >
            <motion.h1 variants={fadeIn} className="text-4xl xl:text-5xl font-extrabold font-display text-background leading-[1.1] mb-5">
              Gestão clínica{' '}
              <span className="text-primary">completa</span>{' '}
              e inteligente
            </motion.h1>
            <motion.p variants={fadeIn} custom={1} className="text-background/50 text-lg leading-relaxed mb-10">
              Agenda, prontuário eletrônico, financeiro e laboratório integrados para transformar a gestão do seu consultório.
            </motion.p>

            <motion.div variants={fadeIn} custom={2} className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  custom={3 + i}
                  className="group bg-background/[0.04] backdrop-blur-sm border border-background/[0.08] rounded-xl p-4 hover:bg-background/[0.08] transition-colors duration-300"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <f.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <p className="font-bold text-background text-sm mb-0.5">{f.title}</p>
                  <p className="text-background/35 text-xs leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="flex items-center gap-6 text-background/25 text-xs"
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

      {/* ─── Right Panel: Auth Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/3 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <img src={logoIcon} alt="EloLab" className="h-11 w-11 drop-shadow-md" />
              <span className="text-2xl font-extrabold font-display tracking-tight text-foreground">
                Elo<span className="text-primary">Lab</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">Sistema de Gestão Clínica</p>
          </div>

          {/* Invite code banner */}
          <AnimatePresence>
            {urlCodigo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-primary/5 border border-primary/15 rounded-xl flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Código de ativação detectado!</p>
                  <p className="text-xs text-muted-foreground">Preencha seus dados para ativar sua conta.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold font-display text-foreground">
              {activeTab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              {activeTab === 'login'
                ? 'Entre com suas credenciais para acessar o sistema'
                : 'Preencha os dados para começar a usar o EloLab'}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/60 rounded-xl h-11 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg font-semibold text-sm">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg font-semibold text-sm">
                Criar Conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-0">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                            <Input
                              type="email"
                              placeholder="seu@email.com"
                              autoComplete="email"
                              className="h-12 pl-10 bg-muted/30 border-border/60 focus:border-primary focus:bg-card rounded-xl transition-colors"
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
                        <FormLabel className="text-sm font-medium text-foreground">Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="h-12 pl-10 pr-10 bg-muted/30 border-border/60 focus:border-primary focus:bg-card rounded-xl transition-colors"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
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
                    className="w-full h-12 font-bold rounded-xl text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                    disabled={isLoading}
                  >
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : 'Entrar'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-0">
              {signupSuccess ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Alert className="border-primary/20 bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-foreground">
                      Conta criada e plano ativado com sucesso! Faça login para acessar o sistema.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : (
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                    {/* Invite code */}
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
                              placeholder="Ex: A1B2C3D4"
                              autoComplete="off"
                              className="h-12 bg-primary/5 border-primary/20 focus:border-primary rounded-xl font-mono text-center text-lg tracking-widest uppercase"
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
                          <FormLabel className="text-sm font-medium text-foreground">Nome completo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                              <Input placeholder="Dr. João Silva" autoComplete="name" className="h-12 pl-10 bg-muted/30 border-border/60 focus:border-primary focus:bg-card rounded-xl transition-colors" {...field} />
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
                          <FormLabel className="text-sm font-medium text-foreground">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                              <Input type="email" placeholder="seu@email.com" autoComplete="email" className="h-12 pl-10 bg-muted/30 border-border/60 focus:border-primary focus:bg-card rounded-xl transition-colors" {...field} />
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
                          <FormLabel className="text-sm font-medium text-foreground">Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                              <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="h-12 pl-10 pr-10 bg-muted/30 border-border/60 focus:border-primary focus:bg-card rounded-xl transition-colors" {...field} />
                              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>
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
                          <FormLabel className="text-sm font-medium text-foreground">Confirmar senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                              <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="h-12 pl-10 pr-10 bg-muted/30 border-border/60 focus:border-primary focus:bg-card rounded-xl transition-colors" {...field} />
                              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
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
                      className="w-full h-12 font-bold rounded-xl text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                      disabled={isLoading}
                    >
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</> : 'Criar conta e ativar plano'}
                    </Button>
                  </form>
                </Form>
              )}
            </TabsContent>
          </Tabs>

          {/* Footer links */}
          <div className="mt-8 space-y-4">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao site
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} EloLab. Todos os direitos reservados.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
