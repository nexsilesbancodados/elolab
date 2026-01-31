import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SupabaseProtectedRoute } from "@/components/SupabaseProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import Auth from "@/pages/Auth";
import AceitarConvite from "@/pages/AceitarConvite";
import Dashboard from "@/pages/Dashboard";
import Pacientes from "@/pages/Pacientes";
import Agenda from "@/pages/Agenda";
import Fila from "@/pages/Fila";
import PainelTV from "@/pages/PainelTV";
import Prontuarios from "@/pages/Prontuarios";
import Financeiro from "@/pages/Financeiro";
import Relatorios from "@/pages/Relatorios";
import Usuarios from "@/pages/Usuarios";
import Configuracoes from "@/pages/Configuracoes";
import Prescricoes from "@/pages/Prescricoes";
import Atestados from "@/pages/Atestados";
import Estoque from "@/pages/Estoque";
import Convenios from "@/pages/Convenios";
import ContasReceber from "@/pages/ContasReceber";
import ContasPagar from "@/pages/ContasPagar";
import Medicos from "@/pages/Medicos";
import Funcionarios from "@/pages/Funcionarios";
import Exames from "@/pages/Exames";
import Triagem from "@/pages/Triagem";
import Salas from "@/pages/Salas";
import ListaEspera from "@/pages/ListaEspera";
import FluxoCaixa from "@/pages/FluxoCaixa";
import Telemedicina from "@/pages/Telemedicina";
import Templates from "@/pages/Templates";
import NotFound from "@/pages/NotFound";
import { NotificationBanner } from "@/components/NotificationBanner";
import { InstallPWA } from "@/components/InstallPWA";

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SupabaseAuthProvider>
              <NotificationBanner />
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
                  <Route path="/telemedicina" element={<Telemedicina />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="/contas-receber" element={<ContasReceber />} />
                  <Route path="/contas-pagar" element={<ContasPagar />} />
                  <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route path="/estoque" element={<Estoque />} />
                  <Route path="/convenios" element={<Convenios />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                  <Route path="/seguranca" element={<Configuracoes />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                </Route>
                
                {/* Redirects */}
                <Route path="/" element={<Navigate to="/auth" replace />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <InstallPWA />
            </SupabaseAuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
