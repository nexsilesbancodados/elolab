import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, ArrowLeft, Send, AlertTriangle, Loader2, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useChatInterno, type ChatConversa, type ChatUsuario, type ChatMensagem } from '@/hooks/useChatInterno';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Helpers ───────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const formatMsgDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Ontem ' + format(date, 'HH:mm');
  return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
};

// ─── Lista de usuários/conversas ───────────────────────────
function ListaConversas({
  usuarios, conversas, onSelect, search, setSearch,
}: {
  usuarios: ChatUsuario[];
  conversas: ChatConversa[];
  onSelect: (user: ChatUsuario) => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  const filtrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Buscar usuário..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtrados.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Nenhum usuário encontrado</div>
          ) : filtrados.map(u => {
            const conversa = conversas.find(c =>
              c.outro_usuario?.user_id === u.user_id
            );
            return (
              <button
                key={u.id}
                onClick={() => onSelect(u)}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(u.nome)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{u.nome}</p>
                    {conversa && conversa.nao_lidas > 0 && (
                      <Badge className="h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-primary">
                        {conversa.nao_lidas}
                      </Badge>
                    )}
                  </div>
                  {conversa?.preview ? (
                    <p className="text-[11px] text-muted-foreground truncate">{conversa.preview}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground capitalize">
                      {u.roles?.[0] ?? 'usuário'}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Visualização de conversa ──────────────────────────────
function ViewConversa({
  conversa,
  mensagens,
  currentUserId,
  loading,
  onBack,
  onEnviar,
}: {
  conversa: ChatConversa;
  mensagens: ChatMensagem[];
  currentUserId: string;
  loading: boolean;
  onBack: () => void;
  onEnviar: (texto: string, urgente: boolean) => void;
}) {
  const [texto, setTexto] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    await onEnviar(texto.trim(), urgente);
    setTexto('');
    setUrgente(false);
    setEnviando(false);
    inputRef.current?.focus();
  };

  const outroNome = conversa.outro_usuario?.nome ?? 'Usuário';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b bg-card">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {getInitials(outroNome)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{outroNome}</p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : mensagens.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Diga olá!
          </div>
        ) : mensagens.map(m => {
          const isOwn = m.remetente_id === currentUserId;
          return (
            <div key={m.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[78%] rounded-2xl px-3 py-2 text-sm',
                isOwn
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm',
              )}>
                {m.urgente && (
                  <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-warning">
                    <AlertTriangle className="h-2.5 w-2.5" /> URGENTE
                  </div>
                )}
                <p className="leading-snug">{m.texto}</p>
                <p className={cn('text-[10px] mt-1', isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                  {formatMsgDate(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-3 border-t space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUrgente(u => !u)}
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border transition-colors',
              urgente
                ? 'bg-warning/10 text-warning border-warning/30'
                : 'text-muted-foreground border-transparent hover:border-border',
            )}
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            Urgente
          </button>
        </div>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            className="flex-1 h-8 text-sm"
            placeholder="Mensagem..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleEnviar} disabled={!texto.trim() || enviando}>
            {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Panel Principal ──────────────────────────────────
export function ChatPanel() {
  const { user } = useSupabaseAuth();
  const [aberto, setAberto] = useState(false);
  const [search, setSearch] = useState('');
  const {
    usuarios, conversas, mensagens, conversaAtiva, setConversaAtiva,
    loading, totalNaoLidas, iniciarConversa, enviarMensagem,
  } = useChatInterno();

  const handleSelectUsuario = async (u: ChatUsuario) => {
    const conversa = await iniciarConversa(u.user_id);
    if (conversa) {
      const conversaCompleta: ChatConversa = {
        id: conversa.id,
        participante_1_id: conversa.participante_1_id ?? conversa.participante_1_id,
        participante_2_id: conversa.participante_2_id ?? conversa.participante_2_id,
        ultima_mensagem_em: conversa.ultima_mensagem_em ?? null,
        preview: conversa.preview ?? null,
        outro_usuario: u,
        nao_lidas: 0,
        urgente_nao_lida: false,
      };
      setConversaAtiva(conversaCompleta);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg relative"
          onClick={() => setAberto(o => !o)}
        >
          <AnimatePresence mode="wait">
            {aberto ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
          {totalNaoLidas > 0 && !aberto && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
              {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
            </span>
          )}
        </Button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-22 right-6 z-50 w-80 h-[460px] rounded-2xl border bg-card shadow-xl flex flex-col overflow-hidden"
            style={{ bottom: '80px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="font-semibold text-sm">Chat Interno</span>
                {totalNaoLidas > 0 && (
                  <Badge className="bg-white/20 text-white border-white/30 text-[10px] h-4 px-1.5">
                    {totalNaoLidas}
                  </Badge>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {conversaAtiva ? (
                  <motion.div
                    key="conversa"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 40, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="h-full"
                  >
                    <ViewConversa
                      conversa={conversaAtiva}
                      mensagens={mensagens}
                      currentUserId={user.id}
                      loading={loading}
                      onBack={() => setConversaAtiva(null)}
                      onEnviar={enviarMensagem}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="lista"
                    initial={{ x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="h-full"
                  >
                    <ListaConversas
                      usuarios={usuarios}
                      conversas={conversas}
                      onSelect={handleSelectUsuario}
                      search={search}
                      setSearch={setSearch}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
