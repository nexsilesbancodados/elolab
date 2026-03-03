import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FlaskConical, CreditCard, User, ExternalLink, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  agendado: 'bg-blue-500/10 text-blue-700 border-blue-300',
  confirmado: 'bg-green-500/10 text-green-700 border-green-300',
  finalizado: 'bg-muted text-muted-foreground',
  cancelado: 'bg-destructive/10 text-destructive',
  faltou: 'bg-destructive/10 text-destructive',
  aprovado: 'bg-green-500/10 text-green-700',
  pendente: 'bg-yellow-500/10 text-yellow-700',
  solicitado: 'bg-blue-500/10 text-blue-700',
  laudo_disponivel: 'bg-green-500/10 text-green-700',
};

export default function PortalPaciente() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [exames, setExames] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);

  const fetchData = async (accessToken: string, action: string) => {
    const { data, error } = await supabase.functions.invoke('patient-portal', {
      body: { action, token: accessToken },
    });
    if (error) throw error;
    return data;
  };

  const handleLogin = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError('');

    try {
      const profileData = await fetchData(token, 'get_profile');
      if (!profileData || profileData.error) {
        setError(profileData?.error || 'Token inválido');
        return;
      }
      setProfile(profileData);
      setAuthenticated(true);

      // Fetch all data in parallel
      const [ag, ex, pg] = await Promise.all([
        fetchData(token, 'get_agendamentos'),
        fetchData(token, 'get_exames'),
        fetchData(token, 'get_pagamentos'),
      ]);
      setAgendamentos(ag || []);
      setExames(ex || []);
      setPagamentos(pg || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao acessar portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('token')) {
      handleLogin();
    }
  }, []);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Portal do Paciente</CardTitle>
            <CardDescription>
              Insira o código de acesso fornecido pela clínica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Código de acesso"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleLogin} disabled={loading || !token.trim()}>
              {loading ? 'Verificando...' : 'Acessar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">EloLab</h1>
            <p className="text-sm text-muted-foreground">Portal do Paciente</p>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{profile?.nome}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <Tabs defaultValue="agendamentos">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agendamentos" className="gap-2">
              <Calendar className="h-4 w-4" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="exames" className="gap-2">
              <FlaskConical className="h-4 w-4" />
              Exames
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agendamentos" className="space-y-3 mt-4">
            {!agendamentos.length ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhuma consulta agendada
                </CardContent>
              </Card>
            ) : (
              agendamentos.map((a: any) => (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{a.tipo || 'Consulta'}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.data} às {a.hora_inicio} • Dr(a). CRM {a.medicos?.crm}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusColors[a.status] || ''}>{a.status}</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="exames" className="space-y-3 mt-4">
            {!exames.length ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhum exame encontrado
                </CardContent>
              </Card>
            ) : (
              exames.map((e: any) => (
                <Card key={e.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{e.tipo_exame}</p>
                      <p className="text-sm text-muted-foreground">
                        Solicitado: {e.data_solicitacao || 'N/A'}
                        {e.data_realizacao && ` • Realizado: ${e.data_realizacao}`}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusColors[e.status] || ''}>{e.status?.replace('_', ' ')}</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pagamentos" className="space-y-3 mt-4">
            {!pagamentos.length ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhum pagamento encontrado
                </CardContent>
              </Card>
            ) : (
              pagamentos.map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{p.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy', { locale: ptBR }) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                        </p>
                        <Badge variant="outline" className={statusColors[p.status] || ''}>{p.status}</Badge>
                      </div>
                      {p.checkout_url && p.status === 'pendente' && (
                        <Button size="sm" variant="outline" onClick={() => window.open(p.checkout_url, '_blank')}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
