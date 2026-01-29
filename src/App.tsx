import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { seedDemoData } from "@/lib/seedData";

// Pages
import Login from "@/pages/Login";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    seedDemoData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/painel-tv" element={<PainelTV />} />
                
                {/* Protected Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pacientes" element={<Pacientes />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/fila" element={<Fila />} />
                  <Route path="/prontuarios" element={<Prontuarios />} />
                  <Route path="/prescricoes" element={<Prescricoes />} />
                  <Route path="/atestados" element={<Atestados />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="/contas-receber" element={<ContasReceber />} />
                  <Route path="/contas-pagar" element={<ContasPagar />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route path="/estoque" element={<Estoque />} />
                  <Route path="/convenios" element={<Convenios />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                  <Route path="/seguranca" element={<Configuracoes />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                </Route>
                
                {/* Redirects */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
