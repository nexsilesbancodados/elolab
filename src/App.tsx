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

// All pages eagerly loaded — instant navigation on every click
import Dashboard from "@/pages/Dashboard";
import Pacientes from "@/pages/Pacientes";
import Agenda from "@/pages/Agenda";
import Fila from "@/pages/Fila";
import Prontuarios from "@/pages/Prontuarios";
import Financeiro from "@/pages/Financeiro";
import Medicos from "@/pages/Medicos";
import Estoque from "@/pages/Estoque";
import Relatorios from "@/pages/Relatorios";
import Usuarios from "@/pages/Usuarios";
import Configuracoes from "@/pages/Configuracoes";
import Prescricoes from "@/pages/Prescricoes";
import Atestados from "@/pages/Atestados";
import Convenios from "@/pages/Convenios";
import ContasReceber from "@/pages/ContasReceber";
import ContasPagar from "@/pages/ContasPagar";
import Funcionarios from "@/pages/Funcionarios";
import Exames from "@/pages/Exames";
import Triagem from "@/pages/Triagem";
import Salas from "@/pages/Salas";
import ListaEspera from "@/pages/ListaEspera";
import FluxoCaixa from "@/pages/FluxoCaixa";
import Templates from "@/pages/Templates";
import Encaminhamentos from "@/pages/Encaminhamentos";
import Automacoes from "@/pages/Automacoes";
import AgenteIA from "@/pages/AgenteIA";
import Analytics from "@/pages/Analytics";
import Pagamentos from "@/pages/Pagamentos";
import Planos from "@/pages/Planos";
import Laboratorio from "@/pages/Laboratorio";
import PrecosExames from "@/pages/PrecosExames";
import Tarefas from "@/pages/Tarefas";
import Retornos from "@/pages/Retornos";
import MapaColeta from "@/pages/MapaColeta";
import LaudosLab from "@/pages/LaudosLab";
import Documentacao from "@/pages/Documentacao";
import PainelAdmin from "@/pages/PainelAdmin";
import CaixaDiario from "@/pages/CaixaDiario";

// Only lazy load rarely-accessed pages
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
      retry: 1,
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
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/aceitar-convite" element={<Suspense fallback={<PageLoader />}><AceitarConvite /></Suspense>} />
                    <Route path="/portal-paciente" element={<Suspense fallback={<PageLoader />}><PortalPaciente /></Suspense>} />
                    <Route path="/painel-tv" element={<SupabaseProtectedRoute><Suspense fallback={<PageLoader />}><PainelTV /></Suspense></SupabaseProtectedRoute>} />
                    
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
                    
                    <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
                  </Routes>
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
