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

// Only lazy load rarely-accessed pages
const LandingPage = lazy(() => import("@/pages/LandingPage"));
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

// Check if we should show only the landing page (production main domain only)
function isLandingOnly() {
  const hostname = window.location.hostname;
  // Only restrict to landing on production elolab.com.br (without app. prefix)
  // In dev/preview, show all routes
  return hostname === 'elolab.com.br' || hostname === 'www.elolab.com.br';
}

function App() {
  const isApp = !isLandingOnly();

  // Global error handling is now initialized in main.tsx via errorTracking.ts

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
                    {isApp ? (
                      <>
                        {/* App subdomain routes (app.elolab.com.br) */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
                        <Route path="/login" element={<Navigate to="/auth" replace />} />
                        <Route path="/aceitar-convite" element={<Suspense fallback={<PageLoader />}><AceitarConvite /></Suspense>} />
                        <Route path="/portal-paciente" element={<Suspense fallback={<PageLoader />}><PortalPaciente /></Suspense>} />
                        <Route path="/painel-tv" element={<SupabaseProtectedRoute><Suspense fallback={<PageLoader />}><PainelTV /></Suspense></SupabaseProtectedRoute>} />
                        
                        {/* Protected Routes — all eagerly loaded, no Suspense needed */}
                        <Route
                          element={
                            <SupabaseProtectedRoute>
                              <MainLayout />
                            </SupabaseProtectedRoute>
                          }
                        >
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/pacientes" element={<Pacientes />} />
                          <Route path="/agenda" element={<Agenda />} />
                          <Route path="/fila" element={<Fila />} />
                          <Route path="/prontuarios" element={<Prontuarios />} />
                          <Route path="/prescricoes" element={<Prescricoes />} />
                          <Route path="/atestados" element={<Atestados />} />
                          <Route path="/medicos" element={<Medicos />} />
                          <Route path="/funcionarios" element={<Funcionarios />} />
                          <Route path="/exames" element={<Exames />} />
                          <Route path="/triagem" element={<Triagem />} />
                          <Route path="/salas" element={<Salas />} />
                          <Route path="/lista-espera" element={<ListaEspera />} />
                          <Route path="/templates" element={<Templates />} />
                          <Route path="/encaminhamentos" element={<Encaminhamentos />} />
                          <Route path="/financeiro" element={<Financeiro />} />
                          <Route path="/contas-receber" element={<ContasReceber />} />
                          <Route path="/contas-pagar" element={<ContasPagar />} />
                          <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
                          <Route path="/pagamentos" element={<Pagamentos />} />
                          <Route path="/relatorios" element={<Relatorios />} />
                          <Route path="/estoque" element={<Estoque />} />
                          <Route path="/convenios" element={<Convenios />} />
                          <Route path="/usuarios" element={<Usuarios />} />
                          
                          <Route path="/configuracoes" element={<Configuracoes />} />
                          <Route path="/automacoes" element={<Automacoes />} />
                          <Route path="/agente-ia" element={<AgenteIA />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/planos" element={<Planos />} />
                          <Route path="/laboratorio" element={<Laboratorio />} />
                          <Route path="/precos-exames" element={<PrecosExames />} />
                          <Route path="/tarefas" element={<Tarefas />} />
                          <Route path="/retornos" element={<Retornos />} />
                          <Route path="/mapa-coleta" element={<MapaColeta />} />
                          <Route path="/laudos-lab" element={<LaudosLab />} />
                          <Route path="/documentacao" element={<Documentacao />} />
                        </Route>
                        
                        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
                      </>
                    ) : (
                      <>
                        {/* Main domain routes (elolab.com.br) */}
                        <Route path="/" element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
                        <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
                        <Route path="/portal-paciente" element={<Suspense fallback={<PageLoader />}><PortalPaciente /></Suspense>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </>
                    )}
                  </Routes>
                <InstallPWA />
              </SupabaseAuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
