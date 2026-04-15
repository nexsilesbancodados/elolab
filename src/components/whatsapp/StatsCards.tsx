import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, MessageSquare, Users, Activity } from 'lucide-react';
import { WhatsAppStats, WhatsAppSession } from './types';

interface StatsCardsProps {
  sessions: WhatsAppSession[];
  stats?: WhatsAppStats;
}

export function StatsCards({ sessions, stats }: StatsCardsProps) {
  const activeSessions = sessions.filter(s => s.status === 'connected').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sessões Ativas</p>
              <p className="text-2xl font-bold">{activeSessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-info/10 rounded-full">
              <MessageSquare className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mensagens Hoje</p>
              <p className="text-2xl font-bold">{stats?.messages || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-full">
              <Users className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversas Hoje</p>
              <p className="text-2xl font-bold">{stats?.conversations || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/20 rounded-full">
              <Activity className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ações do Agente</p>
              <p className="text-2xl font-bold">{stats?.actions || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
