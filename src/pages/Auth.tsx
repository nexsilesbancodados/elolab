import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Loader2, Eye, EyeOff, AlertCircle, Sparkles, Shield, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import clinicBackground from '@/assets/clinic-background.jpg';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const signupSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const features = [
  { icon: Shield, label: 'Seguro', description: 'Dados protegidos' },
  { icon: Clock, label: 'Rápido', description: 'Interface ágil' },
  { icon: Users, label: 'Colaborativo', description: 'Equipe integrada' },
];

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user, profile, isLoading: authLoading } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user && profile) {
      navigate('/dashboard');
    }
  }, [user, profile, authLoading, navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onLogin = async (data: LoginForm) => {
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
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.nome);
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message || 'Erro ao criar conta');
        }
      } else {
        setSignupSuccess(true);
        toast.success('Conta criada! Verifique seu email para confirmar.');
        signupForm.reset();
      }
    } catch (error) {
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${clinicBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/70 to-background/80 backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/20">
            <Activity className="h-8 w-8 text-primary-foreground animate-pulse" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex relative overflow-hidden"
      style={{
        backgroundImage: `url(${clinicBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90 backdrop-blur-[3px]" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10">
        <div className="max-w-lg animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/20">
              <Activity className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">EloLab</h1>
              <p className="text-muted-foreground">Sistema de Gestão de Clínica</p>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold font-display text-foreground mb-4 leading-tight">
            Gerencie sua clínica com{' '}
            <span className="text-primary">eficiência</span> e{' '}
            <span className="text-success">segurança</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8">
            Uma plataforma completa para agendamentos, prontuários, financeiro e muito mais.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div 
                key={feature.label}
                className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 animate-fade-in"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.label}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20 mb-4">
              <Activity className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">EloLab</h1>
            <p className="text-muted-foreground">Sistema de Gestão de Clínica</p>
          </div>

          {/* Auth Card */}
          <Card className="shadow-2xl bg-card/95 backdrop-blur-xl border-border/50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-display">
                {activeTab === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'login' 
                  ? 'Entre com suas credenciais para continuar'
                  : 'Preencha os dados para começar'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="seu@email.com"
                                autoComplete="email"
                                className="h-11 bg-muted/30 border-border/50 focus:border-primary"
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
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  autoComplete="current-password"
                                  className="h-11 bg-muted/30 border-border/50 focus:border-primary pr-10"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full h-11 shadow-md" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          'Entrar'
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  {signupSuccess ? (
                    <Alert className="border-success/50 bg-success/10">
                      <Sparkles className="h-4 w-4 text-success" />
                      <AlertDescription className="text-success">
                        Conta criada com sucesso! Verifique seu email para confirmar o cadastro.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                        <FormField
                          control={signupForm.control}
                          name="nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome completo</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Seu nome"
                                  autoComplete="name"
                                  className="h-11 bg-muted/30 border-border/50 focus:border-primary"
                                  {...field}
                                />
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="seu@email.com"
                                  autoComplete="email"
                                  className="h-11 bg-muted/30 border-border/50 focus:border-primary"
                                  {...field}
                                />
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
                              <FormLabel>Senha</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="h-11 bg-muted/30 border-border/50 focus:border-primary pr-10"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
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
                              <FormLabel>Confirmar senha</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="h-11 bg-muted/30 border-border/50 focus:border-primary pr-10"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full h-11 shadow-md" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Criando conta...
                            </>
                          ) : (
                            'Criar conta'
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </TabsContent>
              </Tabs>

              {/* Info */}
              <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Após criar sua conta, um administrador precisará atribuir uma função para você acessar o sistema.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2024 EloLab. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
