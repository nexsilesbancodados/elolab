import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MonitorSmartphone, HandCoins } from 'lucide-react';
import Recepcao from './Recepcao';
import CaixaDiario from './CaixaDiario';

export default function RecepcaoCaixa() {
  const [activeTab, setActiveTab] = useState('recepcao');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
          <TabsTrigger value="recepcao" className="gap-2">
            <MonitorSmartphone className="h-4 w-4" />
            Recepção
          </TabsTrigger>
          <TabsTrigger value="caixa" className="gap-2">
            <HandCoins className="h-4 w-4" />
            Caixa Diário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recepcao" className="mt-4">
          <Recepcao onOpenCaixa={() => setActiveTab('caixa')} />
        </TabsContent>

        <TabsContent value="caixa" className="mt-4">
          <CaixaDiario />
        </TabsContent>
      </Tabs>
    </div>
  );
}
