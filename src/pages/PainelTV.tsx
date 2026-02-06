import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Upload,
  Trash2,
  Image as ImageIcon,
  Video,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Monitor,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface FilaItem {
  id: string;
  agendamento_id: string;
  posicao: number;
  status: string;
  sala_id: string | null;
  horario_chegada: string;
  prioridade: string | null;
}

interface MediaItem {
  id: string;
  tipo: 'imagem' | 'video';
  nome: string;
  url: string;
  duracao_exibicao: number;
  ordem: number;
  ativo: boolean;
}

export default function PainelTV() {
  const { isAdmin } = useSupabaseAuth();
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [pacientes, setPacientes] = useState<Record<string, string>>({});
  const [medicos, setMedicos] = useState<Record<string, string>>({});
  const [salas, setSalas] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chamadoAtual, setChamadoAtual] = useState<FilaItem | null>(null);

  // Media state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]); // Active only for carousel
  const [allMediaItems, setAllMediaItems] = useState<MediaItem[]>([]); // All for management
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load data
  useEffect(() => {
    loadFila();
    loadMedia();
    const dataInterval = setInterval(loadFila, 5000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Media carousel timer
  useEffect(() => {
    if (!isPlaying || mediaItems.length === 0) return;

    const currentMedia = mediaItems[currentMediaIndex];
    if (!currentMedia) return;

    const duration = currentMedia.tipo === 'video' ? 0 : (currentMedia.duracao_exibicao || 10) * 1000;

    if (currentMedia.tipo === 'imagem') {
      const timer = setTimeout(() => {
        setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [currentMediaIndex, isPlaying, mediaItems]);

  // Handle video end
  const handleVideoEnded = useCallback(() => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
  }, [mediaItems.length]);

  const loadFila = async () => {
    try {
      // Load fila
      const { data: filaData } = await supabase
        .from('fila_atendimento')
        .select('*')
        .in('status', ['aguardando', 'chamado', 'em_atendimento'])
        .order('posicao');

      if (filaData) {
        setFila(filaData);

        // Check for called patients
        const chamado = filaData.find((f) => f.status === 'chamado');
        if (chamado && chamado.id !== chamadoAtual?.id) {
          setChamadoAtual(chamado);
          // Play sound
          try {
            const audio = new Audio('/notification.mp3');
            await audio.play();
          } catch (e) {
            // Audio play failed, ignore
          }
        }

        // Load related data
        const agendamentoIds = filaData.map((f) => f.agendamento_id);
        if (agendamentoIds.length > 0) {
          const { data: agendamentos } = await supabase
            .from('agendamentos')
            .select('id, paciente_id, medico_id, sala_id')
            .in('id', agendamentoIds);

          if (agendamentos) {
            const pacienteIds = agendamentos.map((a) => a.paciente_id);
            const medicoIds = agendamentos.map((a) => a.medico_id);
            const salaIds = agendamentos.map((a) => a.sala_id).filter(Boolean);

            // Load pacientes
            if (pacienteIds.length > 0) {
              const { data: pacientesData } = await supabase
                .from('pacientes')
                .select('id, nome')
                .in('id', pacienteIds);

              if (pacientesData) {
                const map: Record<string, string> = {};
                agendamentos.forEach((a) => {
                  const p = pacientesData.find((p) => p.id === a.paciente_id);
                  if (p) map[a.id] = p.nome;
                });
                setPacientes(map);
              }
            }

            // Load medicos (via profiles)
            if (medicoIds.length > 0) {
              const { data: medicosData } = await supabase
                .from('medicos')
                .select('id, user_id, especialidade')
                .in('id', medicoIds);

              if (medicosData) {
                const userIds = medicosData.map((m) => m.user_id).filter(Boolean);
                const { data: profiles } = await supabase
                  .from('profiles')
                  .select('id, nome')
                  .in('id', userIds);

                const map: Record<string, string> = {};
                agendamentos.forEach((a) => {
                  const m = medicosData.find((m) => m.id === a.medico_id);
                  if (m && profiles) {
                    const p = profiles.find((p) => p.id === m.user_id);
                    if (p) map[a.id] = `Dr(a). ${p.nome}`;
                  }
                });
                setMedicos(map);
              }
            }

            // Load salas
            if (salaIds.length > 0) {
              const { data: salasData } = await supabase
                .from('salas')
                .select('id, nome')
                .in('id', salaIds as string[]);

              if (salasData) {
                const map: Record<string, string> = {};
                salasData.forEach((s) => {
                  map[s.id] = s.nome;
                });
                setSalas(map);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  };

  const loadMedia = async () => {
    try {
      // Load all media for management
      const { data: allData, error: allError } = await supabase
        .from('tv_panel_media')
        .select('*')
        .order('ordem');

      if (allError) throw allError;
      setAllMediaItems((allData as MediaItem[]) || []);

      // Filter active ones for carousel
      const activeItems = (allData as MediaItem[])?.filter(m => m.ativo) || [];
      setMediaItems(activeItems);
    } catch (error) {
      console.error('Erro ao carregar mídias:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Apenas imagens e vídeos são permitidos');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('tv-panel-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('tv-panel-media')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase.from('tv_panel_media').insert({
        tipo: isVideo ? 'video' : 'imagem',
        nome: file.name,
        url: urlData.publicUrl,
        duracao_exibicao: 10,
        ordem: mediaItems.length,
        ativo: true,
      });

      if (dbError) throw dbError;

      toast.success('Mídia adicionada com sucesso!');
      loadMedia();
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(error.message || 'Erro ao fazer upload');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteMedia = async (media: MediaItem) => {
    try {
      // Delete from storage
      const fileName = media.url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('tv-panel-media').remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('tv_panel_media')
        .delete()
        .eq('id', media.id);

      if (error) throw error;

      toast.success('Mídia removida');
      loadMedia();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover mídia');
    }
  };

  const toggleMediaActive = async (media: MediaItem) => {
    try {
      const { error } = await supabase
        .from('tv_panel_media')
        .update({ ativo: !media.ativo })
        .eq('id', media.id);

      if (error) throw error;
      loadMedia();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar mídia');
    }
  };

  const getPacienteNome = (agendamentoId: string) => {
    return pacientes[agendamentoId] || 'Paciente';
  };

  const getMedicoNome = (agendamentoId: string) => {
    return medicos[agendamentoId] || '';
  };

  const getSalaNome = (salaId: string | null) => {
    if (!salaId) return 'Recepção';
    return salas[salaId] || 'Sala';
  };

  const filaAguardando = fila
    .filter((f) => f.status === 'aguardando')
    .sort((a, b) => a.posicao - b.posicao);

  const emAtendimento = fila
    .filter((f) => f.status === 'em_atendimento')
    .sort((a, b) => a.posicao - b.posicao);

  const chamados = fila.filter((f) => f.status === 'chamado');

  const currentMedia = mediaItems[currentMediaIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background Media Carousel */}
      {mediaItems.length > 0 && currentMedia && (
        <div className="absolute inset-0 z-0">
          {currentMedia.tipo === 'imagem' ? (
            <img
              key={currentMedia.id}
              src={currentMedia.url}
              alt={currentMedia.nome}
              className="w-full h-full object-cover animate-fade-in"
            />
          ) : (
            <video
              key={currentMedia.id}
              src={currentMedia.url}
              autoPlay
              muted
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover"
            />
          )}
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-slate-900/50" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen p-6 md:p-8">
        {/* Header */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
              <span className="text-primary">Elo</span>Lab
            </h1>
            <p className="text-lg md:text-xl text-white/60 mt-1">Painel de Atendimento</p>
          </div>
          <div className="text-right">
            <p className="text-5xl md:text-6xl font-bold font-display tracking-tight">
              {format(currentTime, 'HH:mm')}
            </p>
            <p className="text-lg md:text-xl text-white/60 capitalize">
              {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </header>

        {/* Admin Settings Button */}
        {isAdmin() && (
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed top-6 right-6 z-50 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Configurar Mídia do Painel
                </DialogTitle>
                <DialogDescription>
                  Adicione imagens ou vídeos para exibir no painel da TV
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Upload */}
                <div className="space-y-2">
                  <Label>Adicionar Nova Mídia</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="flex-1"
                    />
                    {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: JPG, PNG, GIF, MP4, WEBM
                  </p>
                </div>

                {/* Media List */}
                <div className="space-y-2">
                  <Label>Mídias Cadastradas ({allMediaItems.length})</Label>
                  {allMediaItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma mídia cadastrada</p>
                      <p className="text-sm">Faça upload de imagens ou vídeos acima</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allMediaItems.map((media) => (
                        <Card key={media.id} className="overflow-hidden">
                          <CardContent className="p-3 flex items-center gap-3">
                            {/* Thumbnail */}
                            <div className="h-16 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {media.tipo === 'imagem' ? (
                                <img
                                  src={media.url}
                                  alt={media.nome}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                  <Video className="h-6 w-6 text-white/60" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{media.nome}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={media.tipo === 'video' ? 'secondary' : 'outline'}>
                                  {media.tipo === 'video' ? (
                                    <Video className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                  )}
                                  {media.tipo}
                                </Badge>
                                {media.tipo === 'imagem' && (
                                  <span className="text-xs text-muted-foreground">
                                    {media.duracao_exibicao}s
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={media.ativo}
                                onCheckedChange={() => toggleMediaActive(media)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMedia(media)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Media Controls (for admins) */}
        {isAdmin() && mediaItems.length > 1 && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-xs text-white/60 ml-2">
              {currentMediaIndex + 1}/{mediaItems.length}
            </span>
          </div>
        )}

        {/* Chamada Atual - Destaque */}
        {chamados.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-primary/20 animate-pulse">
              <p className="text-xl md:text-2xl mb-2 text-white/80">Chamando:</p>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-4xl md:text-5xl font-bold font-display">
                    {getPacienteNome(chamados[0].agendamento_id)}
                  </p>
                  <p className="text-xl md:text-2xl text-white/80 mt-1">
                    {getMedicoNome(chamados[0].agendamento_id)}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-2xl md:text-3xl font-bold bg-white/20 px-6 py-3 rounded-xl inline-block">
                    {getSalaNome(chamados[0].sala_id)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Em Atendimento */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
            <div className="bg-purple-600/80 px-6 py-4">
              <h2 className="text-xl md:text-2xl font-bold font-display">Em Atendimento</h2>
            </div>
            <div className="p-4 md:p-6">
              {emAtendimento.length === 0 ? (
                <p className="text-center text-white/50 py-8 text-lg">
                  Nenhum atendimento em andamento
                </p>
              ) : (
                <div className="space-y-3">
                  {emAtendimento.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 bg-purple-500/20 rounded-xl border border-purple-500/30"
                    >
                      <div>
                        <p className="text-lg md:text-xl font-semibold">
                          {getPacienteNome(item.agendamento_id)}
                        </p>
                        <p className="text-white/60">{getMedicoNome(item.agendamento_id)}</p>
                      </div>
                      <div className="text-right">
                        <span className="bg-purple-600 px-4 py-2 rounded-full text-sm md:text-base font-medium">
                          {getSalaNome(item.sala_id)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Aguardando */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
            <div className="bg-white/10 px-6 py-4">
              <h2 className="text-xl md:text-2xl font-bold font-display">Aguardando</h2>
            </div>
            <div className="p-4 md:p-6">
              {filaAguardando.length === 0 ? (
                <p className="text-center text-white/50 py-8 text-lg">
                  Nenhum paciente aguardando
                </p>
              ) : (
                <div className="space-y-2">
                  {filaAguardando.slice(0, 8).map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex justify-between items-center p-3 md:p-4 rounded-xl transition-colors',
                        index === 0
                          ? 'bg-yellow-500/20 border border-yellow-500/30'
                          : 'bg-white/5 border border-white/5'
                      )}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <span
                          className={cn(
                            'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base',
                            index === 0 ? 'bg-yellow-500 text-slate-900' : 'bg-white/10'
                          )}
                        >
                          {item.posicao}
                        </span>
                        <div>
                          <p className="text-base md:text-lg font-medium">
                            {getPacienteNome(item.agendamento_id)}
                          </p>
                          <p className="text-sm text-white/50">
                            {getMedicoNome(item.agendamento_id)}
                          </p>
                        </div>
                      </div>
                      <span className="text-white/40 text-sm">
                        {format(new Date(item.horario_chegada), 'HH:mm')}
                      </span>
                    </div>
                  ))}
                  {filaAguardando.length > 8 && (
                    <p className="text-center text-white/40 mt-4">
                      E mais {filaAguardando.length - 8} pacientes...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-white/40">
          <p>Por favor, aguarde seu nome ser chamado e dirija-se ao local indicado.</p>
        </footer>
      </div>
    </div>
  );
}
