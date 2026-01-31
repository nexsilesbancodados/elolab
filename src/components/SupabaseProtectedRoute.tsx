import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth, AppRole } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

interface SupabaseProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function SupabaseProtectedRoute({ children, allowedRoles }: SupabaseProtectedRouteProps) {
  const { user, profile, isLoading, hasAnyRole } = useSupabaseAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has any role assigned
  if (!profile || profile.roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Acesso Pendente</h1>
          <p className="text-muted-foreground mb-4">
            Sua conta foi criada, mas você ainda não tem uma função atribuída.
            Por favor, aguarde um administrador configurar seu acesso.
          </p>
          <p className="text-sm text-muted-foreground">
            Logado como: {user.email}
          </p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
