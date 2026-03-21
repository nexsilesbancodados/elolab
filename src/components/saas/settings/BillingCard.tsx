import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Download, AlertTriangle, CheckCircle2, Crown } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface BillingCardProps {
  plan: {
    name: string;
    price: number;
    interval: "mensal" | "anual";
    features?: string[];
  };
  usage?: {
    current: number;
    limit: number;
    unit: string;
  };
  paymentMethod?: {
    brand: string;
    last4: string;
    expiresAt: string;
  };
  nextBillingDate?: string;
  invoices?: { date: string; amount: number; status: "paid" | "pending" | "failed" }[];
  onUpgrade?: () => void;
  onManagePayment?: () => void;
  onDownloadInvoice?: (index: number) => void;
  currency?: string;
}

const statusConfig = {
  paid: { label: "Pago", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/20" },
  failed: { label: "Falhou", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function BillingCard({
  plan,
  usage,
  paymentMethod,
  nextBillingDate,
  invoices,
  onUpgrade,
  onManagePayment,
  onDownloadInvoice,
  currency = "R$",
}: BillingCardProps) {
  const usagePercent = usage ? (usage.current / usage.limit) * 100 : 0;
  const isNearLimit = usagePercent > 80;

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold font-display">{plan.name}</h3>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                  Ativo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {currency} {plan.price.toLocaleString("pt-BR")}/{plan.interval}
              </p>
            </div>
          </div>
          {onUpgrade && (
            <Button onClick={onUpgrade} size="sm" className="gap-1">
              <Crown className="w-3.5 h-3.5" />
              Upgrade
            </Button>
          )}
        </div>

        {plan.features && (
          <div className="flex flex-wrap gap-2 mt-3">
            {plan.features.map(f => (
              <span key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                {f}
              </span>
            ))}
          </div>
        )}

        {nextBillingDate && (
          <p className="text-xs text-muted-foreground mt-4">
            Próxima cobrança: {nextBillingDate}
          </p>
        )}
      </div>

      {/* Usage */}
      {usage && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Uso do plano</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{usage.unit}</span>
            <span className="text-sm font-medium">
              {usage.current.toLocaleString("pt-BR")} / {usage.limit.toLocaleString("pt-BR")}
            </span>
          </div>
          <Progress value={usagePercent} className={`h-2 ${isNearLimit ? "[&>div]:bg-warning" : ""}`} />
          {isNearLimit && (
            <div className="flex items-center gap-2 mt-3 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Você está perto do limite do plano</span>
            </div>
          )}
        </div>
      )}

      {/* Payment method */}
      {paymentMethod && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Método de pagamento</h3>
            {onManagePayment && (
              <Button variant="ghost" size="sm" onClick={onManagePayment}>
                Gerenciar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-muted/50">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{paymentMethod.brand} •••• {paymentMethod.last4}</p>
              <p className="text-xs text-muted-foreground">Expira em {paymentMethod.expiresAt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoices */}
      {invoices && invoices.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50">
            <h3 className="font-semibold">Faturas</h3>
          </div>
          <div className="divide-y divide-border/50">
            {invoices.map((inv, i) => {
              const status = statusConfig[inv.status];
              return (
                <div key={i} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{inv.date}</span>
                    <span className="text-sm font-medium">{currency} {inv.amount.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                    {onDownloadInvoice && inv.status === "paid" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDownloadInvoice(i)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
