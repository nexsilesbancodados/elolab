import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff, Sparkles, Shield, Clock, Users, Stethoscope, ArrowLeft, Gift, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkRateLimit, getRemainingAttempts } from '@/lib/rateLimiter';
import logoInovalab from '@/assets/logo-icon.png';
import heroInstitutional from '@/assets/hero-institutional.png';

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

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, profile, isLoading: authLoading } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Read invite code params from URL
  const urlCodigo = searchParams.get('codigo') || '';
  const urlEmail = searchParams.get('email') || '';
  const urlPlano = searchParams.get('plano') || '';

  // If invite code is in URL, default to signup tab
  useEffect(() => {
    if (urlCodigo) {
      setActiveTab('signup');
    }
  }, [urlCodigo]);

  useEffect(() => {
    if (!authLoading && user && profile) {
      navigate('/dashboard');
    }
  }, [user, profile, authLoading, navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: urlEmail || '', password: '' },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: '',
      email: urlEmail || '',
      password: '',
      confirmPassword: '',
      codigoConvite: urlCodigo || '',
    },
  });

  const onLogin = async (data: LoginForm) => {
    const { allowed, retryAfterMs } = checkRateLimit('login', 'auth');
    if (!allowed) {
      const seconds = Math.ceil(retryAfterMs / 1000);
      toast.error(`Muitas tentativas. Tente novamente em ${seconds}s.`);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login');
        } else {
          toast.error(error.message || 'Erro ao fazer login');
        }
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
      // Find the pending registration by invite code
      const { data: registro, error: regError } = await supabase
        .from('registros_pendentes' as any)
        .select('*')
        .eq('codigo_convite', codigoConvite)
        .in('status', ['pendente', 'pago'])
        .single();

      if (regError || !registro) {
        console.error('Registro pendente não encontrado:', regError);
        toast.error('Código de convite inválido ou expirado.');
        return;
      }

      const reg = registro as any;

      // Check expiration
      if (new Date(reg.expires_at) < new Date()) {
        toast.error('Código de convite expirado.');
        return;
      }

      // Mark registro as activated
      await supabase
        .from('registros_pendentes' as any)
        .update({
          status: 'ativado',
          user_id: userId,
          activated_at: new Date().toISOString(),
        })
        .eq('id', reg.id);

      // Start trial or activate subscription based on status
      if (reg.status === 'pago') {
        // Payment already confirmed - create active subscription
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
              user_id: userId,
              plano_id: p.id,
              plano_slug: p.slug,
              status: 'ativa',
              em_trial: false,
              data_inicio: new Date().toISOString(),
            });
          toast.success(`Plano ${p.nome} ativado com sucesso! 🎉`);
        }
      } else {
        // Trial mode - start free trial via RPC
        const { data: result } = await supabase.rpc('start_free_trial' as any, {
          _user_id: userId,
          _plano_slug: reg.plano_slug,
        });

        const res = result as any;
        if (res?.success) {
          toast.success(`Teste grátis ativado! ${res.plano_nome} por 3 dias. 🎉`);
        }
      }
    } catch (err) {
      console.error('Erro ao ativar assinatura:', err);
    }
  };

  const onSignup = async (data: SignupForm) => {
    const { allowed, retryAfterMs } = checkRateLimit('signup', 'auth');
    if (!allowed) {
      const seconds = Math.ceil(retryAfterMs / 1000);
      toast.error(`Muitas tentativas. Tente novamente em ${seconds}s.`);
      return;
    }
    setIsLoading(true);
    try {
      // Validate invite code first
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
        toast.error('Código de convite expirado. Solicite um novo.');
        setIsLoading(false);
        return;
      }

      const result = await signUp(data.email, data.password, data.nome);
      if (result.error) {
        if (result.error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(result.error.message || 'Erro ao criar conta');
        }
      } else {
        // If user is immediately available (auto-confirm enabled), activate subscription
        const userId = result.data?.user?.id;
        if (userId) {
          await activateSubscription(userId, data.codigoConvite);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-[hsl(215,28%,12%)]">
        <div className="flex flex-col items-center gap-4">
          <img src={logoInovalab} alt="EloLab" className="h-14 w-14 rounded-xl" />
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(168,76%,50%)]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.4}}>
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src={heroInstitutional}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(215,28%,10%)]/85 via-[hsl(215,28%,12%)]/80 to-[hsl(168,76%,25%)]/60" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img src={logoInovalab} alt="EloLab" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-xl font-extrabold font-display tracking-tight text-white">
              ELO<span className="text-[hsl(168,76%,50%)]">LAB</span>
            </span>
          </div>

          {/* Center content */}
          <div className="max-w-lg">
            <h1 className="text-4xl font-extrabold font-display text-white leading-tight mb-4">
              Gestão clínica completa,{' '}
              <span className="text-[hsl(168,76%,50%)]">segura e inteligente</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-10">
              Agenda, prontuário eletrônico, financeiro e IA integrada para transformar a gestão do seu consultório.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, label: 'LGPD', desc: 'Dados protegidos' },
                { icon: Clock, label: 'Rápido', desc: 'Interface ágil' },
                { icon: Users, label: 'Equipe', desc: 'Multiusuário' },
              ].map((f, i) => (
                <div key={i} className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <f.icon className="h-5 w-5 text-[hsl(168,76%,50%)] mb-3" />
                  <p className="font-bold text-white text-sm">{f.label}</p>
                  <p className="text-white/40 text-xs">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Shield className="h-3.5 w-3.5" />
            <span>Em conformidade com a LGPD</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <img src={logoInovalab} alt="EloLab" className="h-10 w-10 rounded-lg" />
              <span className="text-2xl font-extrabold font-display tracking-tight">
                ELO<span className="text-[hsl(168,76%,36%)]">LAB</span>
              </span>
            </div>
            <p className="text-[hsl(215,15%,50%)] text-sm">Sistema de Gestão Clínica</p>
          </div>

          {/* Invite code banner */}
          {urlCodigo && (
            <div className="mb-6 p-4 bg-[hsl(168,76%,95%)] border border-[hsl(168,76%,36%)]/20 rounded-xl flex items-center gap-3">
              <Gift className="h-5 w-5 text-[hsl(168,76%,36%)] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[hsl(168,76%,25%)]">Código de ativação detectado!</p>
                <p className="text-xs text-[hsl(168,76%,35%)]">Preencha seus dados para ativar sua conta.</p>
              </div>
            </div>
          )}

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold font-display text-[hsl(215,28%,17%)]">
              {activeTab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-[hsl(215,15%,50%)] mt-1">
              {activeTab === 'login'
                ? 'Entre com suas credenciais para acessar o sistema'
                : 'Preencha os dados para começar a usar o EloLab'}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[hsl(210,40%,96%)] rounded-lg h-11">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-semibold">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-semibold">
                Criar Conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-[hsl(215,28%,17%)]">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            autoComplete="email"
                            className="h-12 bg-[hsl(210,40%,98%)] border-[hsl(220,13%,91%)] focus:border-[hsl(168,76%,36%)] rounded-xl"
                            {...field}
                          />
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
                        <FormLabel className="text-sm font-medium text-[hsl(215,28%,17%)]">Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="h-12 bg-[hsl(210,40%,98%)] border-[hsl(220,13%,91%)] focus:border-[hsl(168,76%,36%)] rounded-xl pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-[hsl(215,15%,50%)]" /> : <Eye className="h-4 w-4 text-[hsl(215,15%,50%)]" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white font-bold rounded-xl shadow-lg shadow-[hsl(168,76%,36%)]/20 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : 'Entrar'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              {signupSuccess ? (
                <Alert className="border-[hsl(168,76%,36%)]/30 bg-[hsl(168,76%,95%)]">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)]" />
                  <AlertDescription className="text-[hsl(168,76%,30%)]">
                    Conta criada e plano ativado com sucesso! Faça login para acessar o sistema.
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                    {/* Invite code field - highlighted */}
                    <FormField
                      control={signupForm.control}
                      name="codigoConvite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-[hsl(168,76%,30%)] flex items-center gap-1.5">
                            <Gift className="h-3.5 w-3.5" /> Código de Convite
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: A1B2C3D4"
                              autoComplete="off"
                              className="h-12 bg-[hsl(168,76%,97%)] border-[hsl(168,76%,36%)]/30 focus:border-[hsl(168,76%,36%)] rounded-xl font-mono text-center text-lg tracking-widest uppercase"
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
                          <FormLabel className="text-sm font-medium text-[hsl(215,28%,17%)]">Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. João Silva" autoComplete="name" className="h-12 bg-[hsl(210,40%,98%)] border-[hsl(220,13%,91%)] focus:border-[hsl(168,76%,36%)] rounded-xl" {...field} />
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
                          <FormLabel className="text-sm font-medium text-[hsl(215,28%,17%)]">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" autoComplete="email" className="h-12 bg-[hsl(210,40%,98%)] border-[hsl(220,13%,91%)] focus:border-[hsl(168,76%,36%)] rounded-xl" {...field} />
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
                          <FormLabel className="text-sm font-medium text-[hsl(215,28%,17%)]">Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="h-12 bg-[hsl(210,40%,98%)] border-[hsl(220,13%,91%)] focus:border-[hsl(168,76%,36%)] rounded-xl pr-10" {...field} />
                              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4 text-[hsl(215,15%,50%)]" /> : <Eye className="h-4 w-4 text-[hsl(215,15%,50%)]" />}
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
                          <FormLabel className="text-sm font-medium text-[hsl(215,28%,17%)]">Confirmar senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="h-12 bg-[hsl(210,40%,98%)] border-[hsl(220,13%,91%)] focus:border-[hsl(168,76%,36%)] rounded-xl pr-10" {...field} />
                              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff className="h-4 w-4 text-[hsl(215,15%,50%)]" /> : <Eye className="h-4 w-4 text-[hsl(215,15%,50%)]" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-12 bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white font-bold rounded-xl shadow-lg shadow-[hsl(168,76%,36%)]/20 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</> : 'Criar conta e ativar plano'}
                    </Button>
                  </form>
                </Form>
              )}
            </TabsContent>
          </Tabs>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 mt-6 text-sm font-medium text-[hsl(168,76%,36%)] hover:text-[hsl(168,76%,28%)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>

          <p className="text-center text-xs text-[hsl(215,15%,60%)] mt-4">
            © {new Date().getFullYear()} EloLab. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}