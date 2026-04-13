import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, AlertTriangle, Loader2, Search, CheckCheck, Check, Smile, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useChatInterno, type ChatConversa, type ChatUsuario, type ChatMensagem } from '@/hooks/useChatInterno';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { format, isToday, isYesterday } from 'date-fns';
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

const formatConvDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Ontem';
  return format(date, 'dd/MM', { locale: ptBR });
};

const QUICK_EMOJIS = ['👍', '❤️', '😊', '👋', '🙏', '✅'];

// ─── Sidebar com lista de conversas ───────────────────────
function SidebarConversas({
  usuarios,
  conversas,
  conversaAtivaId,
  onSelect,
  search,
  setSearch,
}: {
  usuarios: ChatUsuario[];
  conversas: ChatConversa[];
  conversaAtivaId: string | null;
  onSelect: (user: ChatUsuario) => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  const conversasComUsuarios = conversas
    .filter(c => c.outro_usuario)
    .sort((a, b) => {
      if (a.urgente_nao_lida && !b.urgente_nao_lida) return -1;
      if (!a.urgente_nao_lida && b.urgente_nao_lida) return 1;
      if (a.nao_lidas > 0 && b.nao_lidas === 0) return -1;
      if (a.nao_lidas === 0 && b.nao_lidas > 0) return 1;
      return 0;
    });

  const idsComConversa = new Set(conversasComUsuarios.map(c => c.outro_usuario?.id).filter(Boolean));
  const semConversa = usuarios.filter(u => !idsComConversa.has(u.id));

  const filtrados = search
    ? usuarios.filter(u => u.nome.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Chat Interno
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 h-9 text-sm rounded-lg border-input"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Search results */}
          {search && (
            <>
              {filtrados.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              ) : (
                filtrados.map(u => (
                  <button
                    key={u.id}
                    onClick={() => onSelect(u)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(u.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.nome}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </button>
                ))
              )}
            </>
          )}

          {/* Normal view */}
          {!search && (
            <>
              {conversasComUsuarios.length > 0 && (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2">
                    Conversas
                  </p>
                  {conversasComUsuarios.map(c => (
                    <button
                      key={c.id}
                      onClick={() => c.outro_usuario && onSelect(c.outro_usuario)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-left',
                        conversaAtivaId === c.id
                          ? 'bg-primary/10 border-l-2 border-primary'
                          : c.urgente_nao_lida
                          ? 'bg-destructive/5 hover:bg-destructive/10'
                          : c.nao_lidas > 0
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : 'hover:bg-muted/60',
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          {c.outro_usuario?.avatar_url && (
                            <AvatarImage src={c.outro_usuario.avatar_url} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(c.outro_usuario?.nome ?? '?')}
                          </AvatarFallback>
                        </Avatar>
                        {c.nao_lidas > 0 && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
                            {c.nao_lidas > 9 ? '9+' : c.nao_lidas}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            'text-sm truncate',
                            c.nao_lidas > 0 ? 'font-bold' : 'font-medium',
                          )}>
                            {c.outro_usuario?.nome}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatConvDate(c.ultima_mensagem_em)}
                          </span>
                        </div>
                        <p className={cn(
                          'text-[12px] truncate',
                          c.nao_lidas > 0 ? 'text-foreground font-medium' : 'text-muted-foreground',
                        )}>
                          {c.urgente_nao_lida && '🔴 '}{c.preview || 'Sem mensagens'}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {semConversa.length > 0 && (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 mt-2">
                    Equipe
                  </p>
                  {semConversa.map(u => (
                    <button
                      key={u.id}
                      onClick={() => onSelect(u)}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {getInitials(u.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.nome}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {conversasComUsuarios.length === 0 && semConversa.length === 0 && (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Nenhum membro da equipe
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Date separator ────────────────────────────────────────
function DateSeparator({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  let label: string;
  if (isToday(date)) label = 'Hoje';
  else if (isYesterday(date)) label = 'Ontem';
  else label = format(date, "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-[10px] font-medium text-muted-foreground bg-card px-2">{label}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

// ─── Visualização de conversa ──────────────────────────────
function ViewConversa({
  conversa,
  mensagens,
  currentUserId,
  loading,
  onEnviar,
  onMobileBack,
}: {
  conversa: ChatConversa;
  mensagens: ChatMensagem[];
  currentUserId: string;
  loading: boolean;
  onEnviar: (texto: string, urgente: boolean) => void;
  onMobileBack?: () => void;
}) {
  const [texto, setTexto] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    await onEnviar(texto.trim(), urgente);
    setTexto('');
    setUrgente(false);
    setShowEmojis(false);
    setEnviando(false);
    inputRef.current?.focus();
  };

  const outroNome = conversa.outro_usuario?.nome ?? 'Usuário';

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMensagem[] }[] = [];
  mensagens.forEach(m => {
    const dateKey = format(new Date(m.created_at), 'yyyy-MM-dd');
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateKey) {
      last.msgs.push(m);
    } else {
      groupedMessages.push({ date: dateKey, msgs: [m] });
    }
  });

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-primary/5">
        {onMobileBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full md:hidden" onClick={onMobileBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10 shrink-0">
          {conversa.outro_usuario?.avatar_url && (
            <AvatarImage src={conversa.outro_usuario.avatar_url} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {getInitials(outroNome)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{outroNome}</p>
          <p className="text-[11px] text-muted-foreground">
            {conversa.outro_usuario?.email}
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Carregando mensagens...</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Nenhuma mensagem</p>
              <p className="text-xs text-muted-foreground mt-1">
                Envie uma mensagem para {outroNome.split(' ')[0]}
              </p>
            </div>
          ) : (
            <>
              {groupedMessages.map(group => (
                <div key={group.date}>
                  <DateSeparator dateStr={group.msgs[0].created_at} />
                  {group.msgs.map((m, idx) => {
                    const isOwn = m.remetente_id === currentUserId;
                    const showTime = idx === group.msgs.length - 1
                      || group.msgs[idx + 1]?.remetente_id !== m.remetente_id
                      || new Date(group.msgs[idx + 1]?.created_at).getTime() - new Date(m.created_at).getTime() > 300000;

                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                      >
                        <div className={cn(
                          'max-w-[60%] rounded-xl px-3.5 py-2 text-sm shadow-sm',
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted text-foreground rounded-bl-none',
                          m.urgente && !isOwn && 'border border-destructive/30 bg-destructive/5',
                        )}>
                          {m.urgente && (
                            <div className={cn(
                              'flex items-center gap-1 mb-1 text-[10px] font-bold',
                              isOwn ? 'text-primary-foreground/80' : 'text-destructive',
                            )}>
                              <AlertTriangle className="h-2.5 w-2.5" /> URGENTE
                            </div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{m.texto}</p>
                          {showTime && (
                            <div className={cn(
                              'flex items-center gap-1 mt-1 justify-end',
                              isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground',
                            )}>
                              <span className="text-[10px]">{format(new Date(m.created_at), 'HH:mm')}</span>
                              {isOwn && (
                                m.lida_em
                                  ? <CheckCheck className="h-3 w-3 text-blue-300" />
                                  : <Check className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-card space-y-2">
        <AnimatePresence>
          {showEmojis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex gap-1 pb-2">
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setTexto(t => t + emoji)}
                    className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-base transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setUrgente(u => !u)}
                className={cn(
                  'flex items-center justify-center h-9 w-9 rounded-lg transition-colors shrink-0',
                  urgente
                    ? 'bg-destructive/10 text-destructive'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {urgente ? 'Remover urgência' : 'Marcar como urgente'}
            </TooltipContent>
          </Tooltip>

          <button
            onClick={() => setShowEmojis(s => !s)}
            className={cn(
              'flex items-center justify-center h-9 w-9 rounded-lg transition-colors shrink-0',
              showEmojis
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <Smile className="h-4 w-4" />
          </button>

          <Input
            ref={inputRef}
            className="flex-1 h-9 text-sm rounded-lg border-input"
            placeholder="Mensagem..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEnviar();
              }
            }}
          />

          <Button
            size="icon"
            className="h-9 w-9 shrink-0 rounded-lg"
            onClick={handleEnviar}
            disabled={!texto.trim() || enviando}
          >
            {enviando
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────
export default function ChatInterno() {
  const { user } = useSupabaseAuth();
  const [search, setSearch] = useState('');
  const [isMobileViewingChat, setIsMobileViewingChat] = useState(false);

  const {
    usuarios,
    conversas,
    mensagens,
    conversaAtiva,
    setConversaAtiva,
    loading,
    iniciarConversa,
    enviarMensagem,
    fetchMensagens,
  } = useChatInterno();

  const handleSelectUsuario = async (u: ChatUsuario) => {
    const conversa = await iniciarConversa(u.user_id);
    if (conversa) {
      const conversaCompleta: ChatConversa = {
        ...conversa,
        outro_usuario: u,
        nao_lidas: 0,
        urgente_nao_lida: false,
      };
      setConversaAtiva(conversaCompleta);
      fetchMensagens(conversa.id);
      setIsMobileViewingChat(true);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-120px)] flex overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile when viewing chat */}
      <div className={cn(
        'w-full md:w-80 border-r overflow-hidden transition-all',
        isMobileViewingChat && 'hidden md:flex',
      )}>
        <SidebarConversas
          usuarios={usuarios}
          conversas={conversas}
          conversaAtivaId={conversaAtiva?.id ?? null}
          onSelect={handleSelectUsuario}
          search={search}
          setSearch={setSearch}
        />
      </div>

      {/* Main content - Hidden on mobile when not viewing chat */}
      <div className={cn(
        'flex-1 overflow-hidden',
        !isMobileViewingChat && 'hidden md:flex',
      )}>
        {conversaAtiva ? (
          <ViewConversa
            conversa={conversaAtiva}
            mensagens={mensagens}
            currentUserId={user.id}
            loading={loading}
            onEnviar={enviarMensagem}
            onMobileBack={() => setIsMobileViewingChat(false)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Bem-vindo ao Chat Interno</h2>
            <p className="text-muted-foreground max-w-md">
              Selecione um membro da equipe na lista ao lado para começar uma conversa. Use <span className="font-semibold text-destructive">urgente</span> para marcar mensagens críticas.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

import React from 'react';
