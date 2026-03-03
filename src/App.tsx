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

// Lazy loaded pages for better initial load performance
const Auth = lazy(() => import("@/pages/Auth"));
const AceitarConvite = lazy(() => import("@/pages/AceitarConvite"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Pacientes = lazy(() => import("@/pages/Pacientes"));
const Agenda = lazy(() => import("@/pages/Agenda"));
const Fila = lazy(() => import("@/pages/Fila"));
const PainelTV = lazy(() => import("@/pages/PainelTV"));
const Prontuarios = lazy(() => import("@/pages/Prontuarios"));
const Financeiro = lazy(() => import("@/pages/Financeiro"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Usuarios = lazy(() => import("@/pages/Usuarios"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const Prescricoes = lazy(() => import("@/pages/Prescricoes"));
const Atestados = lazy(() => import("@/pages/Atestados"));
const Estoque = lazy(() => import("@/pages/Estoque"));
const Convenios = lazy(() => import("@/pages/Convenios"));
const ContasReceber = lazy(() => import("@/pages/ContasReceber"));
const ContasPagar = lazy(() => import("@/pages/ContasPagar"));
const Medicos = lazy(() => import("@/pages/Medicos"));
const Funcionarios = lazy(() => import("@/pages/Funcionarios"));
const Exames = lazy(() => import("@/pages/Exames"));
const Triagem = lazy(() => import("@/pages/Triagem"));
const Salas = lazy(() => import("@/pages/Salas"));
const ListaEspera = lazy(() => import("@/pages/ListaEspera"));
const FluxoCaixa = lazy(() => import("@/pages/FluxoCaixa"));
// Telemedicina removida do escopo
const Templates = lazy(() => import("@/pages/Templates"));
const Encaminhamentos = lazy(() => import("@/pages/Encaminhamentos"));
const Automacoes = lazy(() => import("@/pages/Automacoes"));
const AgenteIA = lazy(() => import("@/pages/AgenteIA"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Pagamentos = lazy(() => import("@/pages/Pagamentos"));
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

function App() {
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
                    {/* Public Routes */}
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/aceitar-convite" element={<AceitarConvite />} />
                    <Route path="/painel-tv" element={<PainelTV />} />
                    
                    {/* Protected Routes */}
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
                      {/* Telemedicina removida do escopo */}
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
                      <Route path="/seguranca" element={<Configuracoes />} />
                      <Route path="/configuracoes" element={<Configuracoes />} />
                      <Route path="/automacoes" element={<Automacoes />} />
                      <Route path="/agente-ia" element={<AgenteIA />} />
                      <Route path="/analytics" element={<Analytics />} />
                    </Route>
                    
                    {/* Redirects */}
                    <Route path="/" element={<Navigate to="/auth" replace />} />
                    
                    {/* 404 */}
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
}

export default App;
