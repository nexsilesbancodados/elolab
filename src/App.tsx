import React, { Suspense, lazy } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

// Core pages that should load fast — keep eagerly loaded
import Dashboard from "@/pages/Dashboard";
import Agenda from "@/pages/Agenda";

// All other pages lazy-loaded for smaller initial bundle
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
const Tarefas = lazy(() => import("@/pages/Tarefas"));
const Retornos = lazy(() => import("@/pages/Retornos"));
const MapaColeta = lazy(() => import("@/pages/MapaColeta"));
const LaudosLab = lazy(() => import("@/pages/LaudosLab"));
const Documentacao = lazy(() => import("@/pages/Documentacao"));
const PainelAdmin = lazy(() => import("@/pages/PainelAdmin"));
const CaixaDiario = lazy(() => import("@/pages/CaixaDiario"));

// Public/rare pages
const Auth = lazy(() => import("@/pages/Auth"));
const AceitarConvite = lazy(() => import("@/pages/AceitarConvite"));
const PainelTV = lazy(() => import("@/pages/PainelTV"));
const PortalPaciente = lazy(() => import("@/pages/PortalPaciente"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-96 mt-4" />
    </div>
  );
}

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

const App = React.forwardRef<HTMLDivElement, Record<string, never>>(function App(_props, _ref) {

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
                <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/aceitar-convite" element={<AceitarConvite />} />
                    <Route path="/portal-paciente" element={<PortalPaciente />} />
                    <Route path="/painel-tv" element={<SupabaseProtectedRoute><PainelTV /></SupabaseProtectedRoute>} />

                    <Route
                      element={
                        <SupabaseProtectedRoute>
                          <MainLayout />
                        </SupabaseProtectedRoute>
                      }
                    >
                      {/* Accessible to all authenticated roles */}
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/agenda" element={<Agenda />} />

                      {/* Clinical — medico + admin + enfermagem */}
                      <Route path="/prontuarios" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico']}><Prontuarios /></SupabaseProtectedRoute>} />
                      <Route path="/prescricoes" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico']}><Prescricoes /></SupabaseProtectedRoute>} />
                      <Route path="/atestados" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico']}><Atestados /></SupabaseProtectedRoute>} />
                      <Route path="/exames" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico', 'enfermagem']}><Exames /></SupabaseProtectedRoute>} />
                      <Route path="/triagem" element={<SupabaseProtectedRoute allowedRoles={['admin', 'enfermagem']}><Triagem /></SupabaseProtectedRoute>} />
                      <Route path="/encaminhamentos" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico']}><Encaminhamentos /></SupabaseProtectedRoute>} />
                      <Route path="/retornos" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico', 'recepcao']}><Retornos /></SupabaseProtectedRoute>} />

                      {/* Lab */}
                      <Route path="/laboratorio" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico', 'enfermagem']}><Laboratorio /></SupabaseProtectedRoute>} />
                      <Route path="/mapa-coleta" element={<SupabaseProtectedRoute allowedRoles={['admin', 'enfermagem']}><MapaColeta /></SupabaseProtectedRoute>} />
                      <Route path="/laudos-lab" element={<SupabaseProtectedRoute allowedRoles={['admin', 'medico', 'enfermagem']}><LaudosLab /></SupabaseProtectedRoute>} />

                      {/* Operational — NOT for doctors */}
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
                      <Route path="/caixa" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro', 'recepcao']}><CaixaDiario /></SupabaseProtectedRoute>} />

                      {/* Financial — admin + financeiro only */}
                      <Route path="/financeiro" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><Financeiro /></SupabaseProtectedRoute>} />
                      <Route path="/contas-receber" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><ContasReceber /></SupabaseProtectedRoute>} />
                      <Route path="/contas-pagar" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><ContasPagar /></SupabaseProtectedRoute>} />
                      <Route path="/fluxo-caixa" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><FluxoCaixa /></SupabaseProtectedRoute>} />
                      <Route path="/pagamentos" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><Pagamentos /></SupabaseProtectedRoute>} />
                      <Route path="/precos-exames" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><PrecosExames /></SupabaseProtectedRoute>} />
                      <Route path="/relatorios" element={<SupabaseProtectedRoute allowedRoles={['admin', 'financeiro']}><Relatorios /></SupabaseProtectedRoute>} />

                      {/* Admin only */}
                      <Route path="/usuarios" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Usuarios /></SupabaseProtectedRoute>} />
                      <Route path="/configuracoes" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Configuracoes /></SupabaseProtectedRoute>} />
                      <Route path="/automacoes" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Automacoes /></SupabaseProtectedRoute>} />
                      <Route path="/agente-ia" element={<SupabaseProtectedRoute allowedRoles={['admin']}><AgenteIA /></SupabaseProtectedRoute>} />
                      <Route path="/analytics" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Analytics /></SupabaseProtectedRoute>} />
                      <Route path="/planos" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Planos /></SupabaseProtectedRoute>} />
                      <Route path="/documentacao" element={<SupabaseProtectedRoute allowedRoles={['admin']}><Documentacao /></SupabaseProtectedRoute>} />
                      <Route path="/painel-admin" element={<SupabaseProtectedRoute allowedRoles={['admin']}><PainelAdmin /></SupabaseProtectedRoute>} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <InstallPWA />
              </SupabaseAuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
