import { useState, useEffect } from 'react';
import { AlertTriangle, X, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ServiceStatus {
  whatsapp: boolean;
  email: boolean;
  pagamentos: boolean;
}

export function ServiceStatusBanner() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkServices();
  }, []);

  const checkServices = async () => {
    try {
      const { data: settings } = await supabase
        .from('automation_settings')
        .select('chave, valor, ativo')
        .in('chave', ['evolution_api_url', 'brevo_api_key', 'mercadopago_access_token']);

      const whatsapp = settings?.some(s => s.chave === 'evolution_api_url' && s.ativo) ?? false;
      const email = settings?.some(s => s.chave === 'brevo_api_key' && s.ativo) ?? false;
      const pagamentos = settings?.some(s => s.chave === 'mercadopago_access_token' && s.ativo) ?? false;

      setStatus({ whatsapp, email, pagamentos });
    } catch {
      // If automation_settings doesn't have these keys, show warnings
      setStatus({ whatsapp: false, email: false, pagamentos: false });
    }
  };

  if (dismissed || !status) return null;

  const warnings: string[] = [];
  if (!status.whatsapp) warnings.push('WhatsApp (Evolution API)');
  if (!status.email) warnings.push('E-mail (Brevo)');
  if (!status.pagamentos) warnings.push('Pagamentos (Mercado Pago)');

  if (warnings.length === 0) return null;

  return (
    <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 mb-4">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Serviços não configurados:</strong> {warnings.join(', ')}. 
          Notificações automáticas podem não funcionar.
        </span>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-yellow-800 hover:text-yellow-900 dark:text-yellow-200"
            onClick={() => navigate('/configuracoes')}
          >
            <Settings className="h-3 w-3 mr-1" />
            Configurar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-yellow-600"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
