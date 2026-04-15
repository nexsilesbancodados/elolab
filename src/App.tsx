import { Suspense, lazy, useEffect } from "react";
import { autoSetupDatabase } from "@/lib/autoSetup";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SupabaseProtectedRoute } from "@/components/SupabaseProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotificationBanner } from "@/components/NotificationBanner";
import { InstallPWA } from "@/components/InstallPWA";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Agenda = lazy(() => import("@/pages/Agenda"));
const Pacientes = lazy(() => import("@/pages/Pacientes"));
const Fila = lazy(() => import("@/pages/Fila"));
const Prontuarios = lazy(() => import("@/pages/Prontuarios"));
const Financeiro = lazy(() => import("@/pages/Financeiro"));
const Medicos = lazy(() => import("@/pages/Medicos"));
const Estoque = lazy(() => import("@/pages/Estoque"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Usuarios = lazy(() => import("@/pages/Usuarios"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const Prescricoes = lazy(() => import("@/pages/Prescricoes"));
const Atestados = lazy(() => import("@/pages/Atestados"));
const Convenios = lazy(() => import("@/pages/Convenios"));
const ContasReceber = lazy(() => import("@/pages/ContasReceber"));
const ContasPagar = lazy(() => import("@/pages/ContasPagar"));
const Funcionarios = lazy(() => import("@/pages/Funcionarios"));
const Exames = lazy(() => import("@/pages/Exames"));
const Triagem = lazy(() => import("@/pages/Triagem"));
const Salas = lazy(() => import("@/pages/Salas"));
const ListaEspera = lazy(() => import("@/pages/ListaEspera"));
const FluxoCaixa = lazy(() => import("@/pages/FluxoCaixa"));
const Templates = lazy(() => import("@/pages/Templates"));
const Encaminhamentos = lazy(() => import("@/pages/Encaminhamentos"));
const Automacoes = lazy(() => import("@/pages/Automacoes"));
const AgenteIA = lazy(() => import("@/pages/AgenteIA"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Pagamentos = lazy(() => import("@/pages/Pagamentos"));
const Planos = lazy(() => import("@/pages/Planos"));
const Laboratorio = lazy(() => import("@/pages/Laboratorio"));
const PrecosExames = lazy(() => import("@/pages/PrecosExames"));
const PrecosServicos = lazy(() => import("@/pages/PrecosServicos"));
const EquipePage = lazy(() => import("@/pages/Equipe"));
const Tarefas = lazy(() => import("@/pages/Tarefas"));
const Retornos = lazy(() => import("@/pages/Retornos"));
const MapaColeta = lazy(() => import("@/pages/MapaColeta"));
const LaudosLab = lazy(() => import("@/pages/LaudosLab"));
const Documentacao = lazy(() => import("@/pages/Documentacao"));
const PainelAdmin = lazy(() => import("@/pages/PainelAdmin"));
const TiposConsulta = lazy(() => import("@/pages/TiposConsulta"));
const RecepcaoCaixa = lazy(() => import("@/pages/RecepcaoCaixa"));
const ChatInterno = lazy(() => import("@/pages/ChatInterno"));
const TemplatesEmail = lazy(() => import("@/pages/TemplatesEmail"));
const Auth = lazy(() => import("@/pages/Auth"));
const AceitarConvite = lazy(() => import("@/pages/AceitarConvite"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const PainelTV = lazy(() => import("@/pages/PainelTV"));
const PortalPaciente = lazy(() => import("@/pages/PortalPaciente"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PoliticaPrivacidade = lazy(() => import("@/pages/PoliticaPrivacidade"));
const PoliticaCookies = lazy(() => import("@/pages/PoliticaCookies"));
const TermosUso = lazy(() => import("@/pages/TermosUso"));
import { CookieConsent } from "@/components/CookieConsent";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

/**
 * Routing mode based on hostname:
 * - www.elolab.com.br / elolab.com.br → Landing only (site institucional)
 * - app.elolab.com.br / localhost / preview → Full SaaS app
 */
function getRoutingMode(): 'landing' | 'app' {
  const host = window.location.hostname;
  if (
    host === 'elolab.com.br' ||
    host === 'www.elolab.com.br'
  ) {
    return 'landing';
  }
  // app.elolab.com.br / localhost / preview → Full SaaS app
  return 'app';
}

function App() {
  const mode = getRoutingMode();

  // Auto-setup database tables
  useEffect(() => {
    const setup = async () => {
      // Run setup after a short delay to ensure auth is ready
      setTimeout(() => {
        autoSetupDatabase().catch(err => console.warn('Auto-setup failed:', err));
      }, 1000);
    };
    setup();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SupabaseAuthProvider>
                <NotificationBanner />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    {mode === 'landing' ? (
                      <>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/login" element={<Navigate to="/auth" replace />} />
                        <Route path="/aceitar-convite" element={<AceitarConvite />} />
                        <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                        <Route path="/politica-cookies" element={<PoliticaCookies />} />
                        <Route path="/termos-uso" element={<TermosUso />} />
                        <Route path="/planos" element={<Planos />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </>
                    ) : (
                      <>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/landing" element={<LandingPage />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/login" element={<Navigate to="/auth" replace />} />
                        <Route path="/aceitar-convite" element={<AceitarConvite />} />
                        <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                        <Route path="/politica-cookies" element={<PoliticaCookies />} />
                        <Route path="/termos-uso" element={<TermosUso />} />
                        <Route path="/portal-paciente" element={<PortalPaciente />} />
                        <Route path="/painel-tv" element={<SupabaseProtectedRoute><PainelTV /></SupabaseProtectedRoute>} />

                        <Route
                          element={
                            <SupabaseProtectedRoute>
                              <SubscriptionGuard>
                                <MainLayout />
                              </SubscriptionGuard>
                            </SupabaseProtectedRoute>
                          }
                        >
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/chat" element={<ChatInterno />} />
                          <Route path="/agenda" element={<Agenda />} />
                          <Route path="/prontuarios" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico']}><Prontuarios /></SupabaseProtectedRoute>} />
                          <Route path="/prescricoes" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico']}><Prescricoes /></SupabaseProtectedRoute>} />
                          <Route path="/atestados" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico']}><Atestados /></SupabaseProtectedRoute>} />
                          <Route path="/exames" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico', 'enfermagem']}><Exames /></SupabaseProtectedRoute>} />
                          <Route path="/triagem" element={<SupabaseProtectedRoute allowedRoles={['admin', 'enfermagem']}><Triagem /></SupabaseProtectedRoute>} />
                          <Route path="/encaminhamentos" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico']}><Encaminhamentos /></SupabaseProtectedRoute>} />
                          <Route path="/retornos" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico', 'recepcao']}><Retornos /></SupabaseProtectedRoute>} />
                          <Route path="/laboratorio" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico', 'enfermagem']}><Laboratorio /></SupabaseProtectedRoute>} />
                          <Route path="/mapa-coleta" element={<SupabaseProtectedRoute allowedRoles={['admin', 'enfermagem']}><MapaColeta /></SupabaseProtectedRoute>} />
                          <Route path="/laudos-lab" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico', 'enfermagem']}><LaudosLab /></SupabaseProtectedRoute>} />
                          <Route path="/pacientes" element={<SupabaseProtectedRoute allowedRoles={['admin', 'recepcao', 'enfermagem']}><Pacientes /></SupabaseProtectedRoute>} />
                          <Route path="/fila" element={<SupabaseProtectedRoute allowedRoles={['admin', 'recepcao', 'enfermagem']}><Fila /></SupabaseProtectedRoute>} />
                          <Route path="/medicos" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Medicos /></SupabaseProtectedRoute>} />
                          <Route path="/funcionarios" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Funcionarios /></SupabaseProtectedRoute>} />
                          <Route path="/salas" element={<SupabaseProtectedRoute allowedRoles={['admin', 'recepcao']}><Salas /></SupabaseProtectedRoute>} />
                          <Route path="/estoque" element={<SupabaseProtectedRoute allowedRoles={['admin', 'enfermagem']}><Estoque /></SupabaseProtectedRoute>} />
                          <Route path="/convenios" element={<SupabaseProtectedRoute allowedRoles={['admin', 'recepcao']}><Convenios /></SupabaseProtectedRoute>} />
                          <Route path="/templates" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico']}><Templates /></SupabaseProtectedRoute>} />
                          <Route path="/lista-espera" element={<SupabaseProtectedRoute allowedRoles={['admin', 'recepcao']}><ListaEspera /></SupabaseProtectedRoute>} />
                          <Route path="/tarefas" element={<SupabaseProtectedRoute allowedRoles={['admin', 'recepcao', 'enfermagem', 'financeiro', 'medico']}><Tarefas /></SupabaseProtectedRoute>} />
                          <Route path="/recepcao" element={<SupabaseProtectedRoute allowedRoles={['admin', 'recepcao', 'financeiro']}><RecepcaoCaixa /></SupabaseProtectedRoute>} />
                          <Route path="/caixa" element={<Navigate to="/recepcao" replace />} />
                          <Route path="/caixa-diario" element={<Navigate to="/recepcao" replace />} />
                          <Route path="/financeiro" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><Financeiro /></SupabaseProtectedRoute>} />
                          <Route path="/contas-receber" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><ContasReceber /></SupabaseProtectedRoute>} />
                          <Route path="/contas-pagar" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><ContasPagar /></SupabaseProtectedRoute>} />
                          <Route path="/fluxo-caixa" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><FluxoCaixa /></SupabaseProtectedRoute>} />
                          <Route path="/pagamentos" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><Pagamentos /></SupabaseProtectedRoute>} />
                          <Route path="/precos-exames" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><PrecosExames /></SupabaseProtectedRoute>} />
                          <Route path="/tipos-consulta" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><TiposConsulta /></SupabaseProtectedRoute>} />
                          <Route path="/relatorios" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><Relatorios /></SupabaseProtectedRoute>} />
                          <Route path="/usuarios" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Usuarios /></SupabaseProtectedRoute>} />
                          <Route path="/configuracoes" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Configuracoes /></SupabaseProtectedRoute>} />
                          <Route path="/automacoes" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Automacoes /></SupabaseProtectedRoute>} />
                          <Route path="/templates-email" element={<SupabaseProtectedRoute allowedRoles={['admin']}><TemplatesEmail /></SupabaseProtectedRoute>} />
                          <Route path="/agente-ia" element={<SupabaseProtectedRoute allowedRoles={['admin']}><AgenteIA /></SupabaseProtectedRoute>} />
                          <Route path="/analytics" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Analytics /></SupabaseProtectedRoute>} />
                          <Route path="/planos" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Planos /></SupabaseProtectedRoute>} />
                          <Route path="/documentacao" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Documentacao /></SupabaseProtectedRoute>} />
                          <Route path="/painel-admin" element={<SupabaseProtectedRoute allowedRoles={['admin']}><PainelAdmin /></SupabaseProtectedRoute>} />
                        </Route>

                        <Route path="*" element={<NotFound />} />
                      </>
                    )}
                  </Routes>
                </Suspense>
                <InstallPWA />
                <CookieConsent />
              </SupabaseAuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
