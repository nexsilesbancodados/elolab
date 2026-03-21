import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, Settings, CheckCircle2, AlertCircle } from "lucide-react";
import { ReactNode } from "react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  category: string;
  connected: boolean;
  status?: "active" | "error" | "pending";
  onToggle?: (connected: boolean) => void;
  onConfigure?: () => void;
  onConnect?: () => void;
}

interface IntegrationsGridProps {
  integrations: Integration[];
  title?: string;
  subtitle?: string;
  categories?: string[];
}

const statusConfig = {
  active: { label: "Ativo", icon: CheckCircle2, className: "text-success" },
  error: { label: "Erro", icon: AlertCircle, className: "text-destructive" },
  pending: { label: "Pendente", icon: AlertCircle, className: "text-warning" },
};

export function IntegrationsGrid({
  integrations,
  title = "Integrações",
  subtitle,
}: IntegrationsGridProps) {
  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div className="space-y-8">
      {title && (
        <div>
          <h3 className="text-lg font-semibold font-display">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}

      {categories.map(cat => (
        <div key={cat}>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-4">
            {cat}
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            {integrations
              .filter(i => i.category === cat)
              .map((integration, idx) => {
                const status = integration.status ? statusConfig[integration.status] : null;
                const StatusIcon = status?.icon;

                return (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-start gap-4 p-5 rounded-xl border transition-all ${
                      integration.connected
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-card hover:border-primary/10"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      {integration.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{integration.name}</h4>
                        {status && StatusIcon && (
                          <StatusIcon className={`w-3.5 h-3.5 ${status.className}`} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>

                      <div className="flex items-center gap-2 mt-3">
                        {integration.connected ? (
                          <>
                            {integration.onConfigure && (
                              <Button variant="outline" size="sm" onClick={integration.onConfigure} className="h-7 text-xs gap-1">
                                <Settings className="w-3 h-3" />
                                Configurar
                              </Button>
                            )}
                          </>
                        ) : (
                          integration.onConnect && (
                            <Button size="sm" onClick={integration.onConnect} className="h-7 text-xs gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Conectar
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {integration.onToggle && (
                      <Switch
                        checked={integration.connected}
                        onCheckedChange={integration.onToggle}
                      />
                    )}
                  </motion.div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
