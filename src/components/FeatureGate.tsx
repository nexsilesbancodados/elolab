import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  hasAccess: boolean;
  requiredPlan?: string;
  children: React.ReactNode;
}

export function FeatureGate({ feature, hasAccess, requiredPlan = 'EloLab Ultra', children }: FeatureGateProps) {
  const navigate = useNavigate();

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Recurso Premium</CardTitle>
          <CardDescription className="text-base">
            Este recurso está disponível no plano <strong>{requiredPlan}</strong>.
            Faça upgrade para desbloquear.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/planos')} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Ver Planos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
