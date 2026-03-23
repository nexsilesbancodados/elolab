import React from 'react';
import { useUserPlan } from '@/hooks/useSubscriptionPlan';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CreditCard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { user, profile } = useSupabaseAuth();
  const { plan, isLoading, hasActivePlan } = useUserPlan();
  const navigate = useNavigate();

  if (isLoading || !user || !profile) return <>{children}</>;

  // Platform admin always allowed
  if (user.email === 'contato@elolab.com.br') return <>{children}</>;

  // Active plan = allowed
  if (hasActivePlan) return <>{children}</>;

  // Expired subscription - check days since expiry
  if (plan && (plan.status === 'expirada' || plan.status === 'cancelada')) {
    const expiredDate = plan.trial_fim ? new Date(plan.trial_fim) : null;
    if (expiredDate) {
      const daysSinceExpiry = Math.floor((Date.now() - expiredDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceExpiry >= 2) {
        return <SubscriptionBlockedScreen />;
      }
    }
    return <>{children}</>;
  }

  // No subscription but has roles = existing user, allow
  if (profile.roles.length > 0 && !plan) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

function SubscriptionBlockedScreen() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg text-center border-destructive/50 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 p-5 rounded-full bg-destructive/10">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            Acesso Bloqueado
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Sua assinatura expirou há mais de 2 dias e o acesso ao sistema foi suspenso.
            Para continuar utilizando o EloLab, regularize seu pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              Seus dados estão seguros e serão mantidos. Ao regularizar o pagamento,
              todo o seu histórico estará disponível novamente.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="gap-2" onClick={() => navigate('/planos')}>
              <CreditCard className="h-4 w-4" />
              Renovar Assinatura
            </Button>
            <Button variant="outline" size="lg" className="gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}