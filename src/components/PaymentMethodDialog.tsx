import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, QrCode, AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PaymentMethodData) => void;
  isLoading?: boolean;
  planName: string;
  trialDays: number;
}

export interface PaymentMethodData {
  method: 'credit_card' | 'pix_recurring';
  cardNumber?: string;
  cardHolder?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  planName,
  trialDays,
}: PaymentMethodDialogProps) {
  const [method, setMethod] = useState<'credit_card' | 'pix_recurring'>('credit_card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (method === 'credit_card') {
      const { cardNumber, cardHolder, expiryMonth, expiryYear, cvv } = cardData;
      if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
        alert('Por favor, preencha todos os campos do cartão');
        return;
      }
      onSubmit({
        method: 'credit_card',
        cardNumber,
        cardHolder,
        expiryMonth,
        expiryYear,
        cvv,
      });
    } else {
      onSubmit({ method: 'pix_recurring' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Teste Grátis — {planName}</DialogTitle>
          <DialogDescription>
            Teste gratuitamente por {trialDays} dias. A cobrança começará após o período de teste.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-info/20 bg-info/5">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Seus dados de pagamento estão seguros. Nenhuma cobrança será realizada nos primeiros {trialDays} dias.
          </AlertDescription>
        </Alert>

        <Tabs value={method} onValueChange={(v) => setMethod(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credit_card" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Cartão de Crédito
            </TabsTrigger>
            <TabsTrigger value="pix_recurring" className="gap-2">
              <QrCode className="h-4 w-4" />
              PIX Recorrente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credit_card" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="cardHolder">Titular do Cartão</Label>
              <Input
                id="cardHolder"
                name="cardHolder"
                placeholder="Nome completo"
                value={cardData.cardHolder}
                onChange={handleCardChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Número do Cartão</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardData.cardNumber}
                onChange={handleCardChange}
                maxLength={19}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="expiryMonth">Mês</Label>
                <Input
                  id="expiryMonth"
                  name="expiryMonth"
                  placeholder="MM"
                  maxLength={2}
                  value={cardData.expiryMonth}
                  onChange={handleCardChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="expiryYear">Ano</Label>
                <Input
                  id="expiryYear"
                  name="expiryYear"
                  placeholder="YY"
                  maxLength={2}
                  value={cardData.expiryYear}
                  onChange={handleCardChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  name="cvv"
                  placeholder="000"
                  maxLength={4}
                  type="password"
                  value={cardData.cvv}
                  onChange={handleCardChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Alert className="border-warning/20 bg-warning/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Seus dados de cartão não são armazenados em nossos servidores. São processados diretamente pelo Mercado Pago.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="pix_recurring" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg border border-info/20 bg-info/5">
              <p className="text-sm font-medium text-foreground mb-2">PIX Recorrente</p>
              <p className="text-xs text-muted-foreground">
                Você receberá um QR Code do Mercado Pago para autorizar débitos recorrentes mensais via PIX. Sem necessidade de inserir dados sensíveis.
              </p>
            </div>
            <Alert className="border-success/20 bg-success/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Mais seguro e conveniente. Autorize uma única vez e as cobranças acontecem automaticamente.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processando...' : 'Iniciar Teste Grátis'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
