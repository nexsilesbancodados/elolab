import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, FileText, Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { usePacientes, useMedicos } from '@/hooks/useSupabaseData';
import { useCurrentMedico } from '@/hooks/useCurrentMedico';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Database } from '@/integrations/supabase/types';

type StatusExame = Database['public']['Enums']['status_exame'];

const STATUS_COLORS: Record<StatusExame, string> = {
  solicitado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  agendado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  realizado: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  laudo_disponivel: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelado: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<StatusExame, string> = {
  solicitado: 'Solicitado',
  agendado: 'Agendado',
  realizado: 'Realizado',
  laudo_disponivel: 'Laudo Disponível',
  cancelado: 'Cancelado',
};

const TIPOS_EXAME_DEFAULT = [
  // ── Hematologia ──
  'Hemograma Completo', 'Hemograma com Contagem de Plaquetas', 'Coagulograma', 'VHS (Velocidade de Hemossedimentação)',
  'Reticulócitos', 'Tipagem Sanguínea (ABO/Rh)', 'Coombs Direto', 'Coombs Indireto',
  'Teste de Falcização', 'Eletroforese de Hemoglobina', 'Mielograma', 'Tempo de Sangramento (TS)',
  'Tempo de Coagulação (TC)', 'Hematócrito', 'Leucograma',
  // ── Bioquímica ──
  'Glicemia em Jejum', 'Glicemia Pós-Prandial', 'Hemoglobina Glicada (HbA1c)', 'Curva Glicêmica (TOTG)',
  'Colesterol Total', 'Colesterol HDL', 'Colesterol LDL', 'Colesterol VLDL', 'Perfil Lipídico Completo',
  'Triglicerídeos', 'Ureia', 'Creatinina', 'Taxa de Filtração Glomerular (TFG)',
  'Ácido Úrico', 'TGO (AST)', 'TGP (ALT)', 'Gama GT', 'Fosfatase Alcalina',
  'Bilirrubinas (Total e Frações)', 'Bilirrubina Direta', 'Bilirrubina Indireta',
  'Proteínas Totais e Frações', 'Albumina', 'Globulinas',
  'Amilase', 'Lipase', 'LDH (Desidrogenase Láctica)', 'CPK (Creatinoquinase)', 'CPK-MB',
  'Troponina I', 'Troponina T', 'BNP (Peptídeo Natriurético)', 'NT-proBNP',
  'Ferro Sérico', 'Ferritina', 'Transferrina', 'TIBC (Capacidade Total de Ligação do Ferro)',
  'Saturação de Transferrina', 'Haptoglobina',
  'Cálcio Total', 'Cálcio Iônico', 'Fósforo', 'Magnésio',
  'Sódio', 'Potássio', 'Cloro', 'Bicarbonato',
  'Lactato', 'Amônia', 'Ácido Lático', 'Osmolaridade Sérica',
  'Proteína C Reativa Ultrassensível (PCR-us)', 'Homocisteína', 'Lipoproteína (a)',
  'Apolipoproteína A1', 'Apolipoproteína B',
  // ── Função Renal ──
  'Clearance de Creatinina', 'Cistatina C', 'Beta-2 Microglobulina',
  'Relação Albumina/Creatinina Urinária',
  // ── Função Hepática ──
  '5-Nucleotidase', 'Colinesterase', 'Ceruloplasmina', 'Cobre Sérico', 'Alfa-1 Antitripsina',
  // ── Hormônios Tireoidianos ──
  'TSH', 'T4 Livre', 'T4 Total', 'T3 Total', 'T3 Livre', 'T3 Reverso',
  'Anti-TPO (Anticorpos Anti-Peroxidase)', 'Anti-Tireoglobulina', 'TRAb (Anticorpos Anti-Receptor de TSH)',
  'Tireoglobulina', 'Calcitonina',
  // ── Hormônios Reprodutivos ──
  'FSH', 'LH', 'Estradiol (E2)', 'Progesterona', 'Testosterona Total', 'Testosterona Livre',
  'Testosterona Biodisponível', 'SHBG (Globulina Ligadora de Hormônios Sexuais)',
  'Prolactina', 'Androstenediona', '17-OH Progesterona',
  'AMH (Hormônio Anti-Mülleriano)', 'Inibina B',
  'Beta-HCG Quantitativo', 'Beta-HCG Qualitativo',
  'Estrona (E1)', 'Estriol (E3)',
  // ── Hormônios Adrenais ──
  'Cortisol Basal', 'Cortisol Salivar', 'Cortisol Livre Urinário 24h',
  'ACTH', 'DHEA-S', 'DHEA', 'Aldosterona', 'Renina',
  'Metanefrinas Plasmáticas', 'Metanefrinas Urinárias', 'Catecolaminas Urinárias',
  // ── Outros Hormônios ──
  'Insulina Basal', 'Insulina Pós-Prandial', 'Peptídeo C',
  'PTH (Paratormônio)', 'GH (Hormônio do Crescimento)', 'IGF-1', 'IGFBP-3',
  'Vitamina D (25-OH)', 'Vitamina D (1,25-OH)',
  'Leptina', 'Adiponectina', 'Eritropoietina',
  // ── Urinálise ──
  'EAS (Urina Tipo I)', 'Urina 24h (Proteínas)', 'Urina 24h (Creatinina)',
  'Urina 24h (Cálcio)', 'Urina 24h (Ácido Úrico)', 'Urina 24h (Sódio)',
  'Urina 24h (Potássio)', 'Urina 24h (Citrato)', 'Urina 24h (Oxalato)',
  'Urocultura', 'Microalbuminúria', 'Proteinúria de 24h',
  'Clearance de Creatinina (Urina 24h)', 'Pesquisa de Dismorfismo Eritrocitário',
  // ── Parasitologia e Fezes ──
  'Parasitológico de Fezes (EPF)', 'Parasitológico Seriado (3 amostras)',
  'Pesquisa de Sangue Oculto nas Fezes', 'Coprocultura',
  'Pesquisa de Gordura Fecal (Sudan III)', 'Elastase Fecal',
  'Calprotectina Fecal', 'Pesquisa de Rotavírus', 'Pesquisa de H. pylori nas Fezes',
  // ── Sorologia e Imunologia ──
  'Anti-HIV (1 e 2)', 'VDRL', 'FTA-Abs (IgG e IgM)',
  'HBsAg (Hepatite B)', 'Anti-HBs', 'Anti-HBc Total', 'Anti-HBc IgM', 'Anti-HBe', 'HBeAg',
  'Carga Viral Hepatite B (HBV-DNA)', 'Carga Viral Hepatite C (HCV-RNA)',
  'Anti-HCV (Hepatite C)', 'Genotipagem Hepatite C',
  'Anti-HAV IgM', 'Anti-HAV IgG',
  'Toxoplasmose (IgG e IgM)', 'Toxoplasmose (Avidez IgG)',
  'Rubéola (IgG e IgM)', 'Citomegalovírus (IgG e IgM)', 'CMV Avidez IgG',
  'Herpes Simplex 1 (IgG e IgM)', 'Herpes Simplex 2 (IgG e IgM)',
  'Epstein-Barr (VCA IgG/IgM, EBNA)', 'Mononucleose (Monoteste)',
  'Dengue (IgG e IgM)', 'Dengue NS1', 'Chikungunya (IgG e IgM)', 'Zika Vírus (IgG e IgM)',
  'Covid-19 (IgG e IgM)', 'Covid-19 PCR (RT-PCR)',
  'Influenza A/B (Teste Rápido)', 'Influenza PCR',
  'Chagas (IgG)', 'Leishmaniose (Sorologia)',
  'Leptospirose (IgG e IgM)', 'Febre Amarela (IgG e IgM)',
  'PCR (Proteína C Reativa)', 'PCR Ultrassensível',
  'Fator Reumatoide (FR)', 'Anti-CCP (Peptídeo Citrulinado Cíclico)',
  'FAN (Fator Antinuclear)', 'Anti-DNA Nativo (Anti-dsDNA)',
  'Anti-SM', 'Anti-RNP', 'Anti-SSA (Ro)', 'Anti-SSB (La)',
  'Anti-SCL-70', 'Anti-Jo-1', 'Anti-Centrômero',
  'ANCA (c-ANCA e p-ANCA)', 'Anti-Membrana Basal Glomerular',
  'ASLO (Antiestreptolisina O)',
  'Complemento C3', 'Complemento C4', 'CH50',
  'Imunoglobulina A (IgA)', 'Imunoglobulina G (IgG)', 'Imunoglobulina M (IgM)', 'Imunoglobulina E Total (IgE)',
  'IgE Específica (RAST)', 'Imunoeletroforese de Proteínas',
  'Crioglobulinas', 'Waaler-Rose', 'Antifosfolipídeos (aCL IgG/IgM)',
  'Anticoagulante Lúpico', 'Anti-Beta2 Glicoproteína I',
  // ── Marcadores Tumorais ──
  'PSA Total', 'PSA Livre', 'Relação PSA Livre/Total',
  'CEA (Antígeno Carcinoembrionário)', 'CA 125', 'CA 19-9', 'CA 15-3', 'CA 72-4',
  'AFP (Alfafetoproteína)', 'HE4', 'ROMA (Algoritmo de Risco de Malignidade Ovariana)',
  'SCC (Antígeno do Carcinoma de Células Escamosas)',
  'Cromogranina A', 'Enolase Neurônio-Específica (NSE)',
  'Cyfra 21-1', 'Beta-2 Microglobulina Sérica',
  'Antígeno Prostático Específico Complexado',
  // ── Coagulação ──
  'TAP (Tempo de Protrombina)', 'TTPA', 'INR',
  'Fibrinogênio', 'D-Dímero', 'Antitrombina III',
  'Proteína C', 'Proteína S Livre', 'Proteína S Total',
  'Fator V de Leiden (Mutação)', 'Mutação da Protrombina G20210A',
  'Tempo de Trombina', 'Agregação Plaquetária',
  'Fator VIII', 'Fator IX', 'Fator de von Willebrand',
  // ── Vitaminas e Nutrientes ──
  'Vitamina A (Retinol)', 'Vitamina B1 (Tiamina)', 'Vitamina B2 (Riboflavina)',
  'Vitamina B3 (Niacina)', 'Vitamina B5 (Ácido Pantotênico)', 'Vitamina B6 (Piridoxina)',
  'Vitamina B7 (Biotina)', 'Vitamina B9 (Ácido Fólico)', 'Vitamina B12 (Cobalamina)',
  'Vitamina C (Ácido Ascórbico)', 'Vitamina E (Tocoferol)', 'Vitamina K',
  'Zinco', 'Selênio', 'Cobre', 'Cromo', 'Manganês', 'Coenzima Q10',
  // ── Gasometria ──
  'Gasometria Arterial', 'Gasometria Venosa',
  // ── Microbiologia ──
  'Hemocultura (Aeróbia)', 'Hemocultura (Anaeróbia)', 'Hemocultura (Fungos)',
  'Cultura de Secreção', 'Cultura de Escarro', 'Cultura de Líquor',
  'Cultura de Líquido Pleural', 'Cultura de Líquido Ascítico',
  'Cultura de Ponta de Cateter', 'Cultura de Fragmento de Tecido',
  'Antibiograma', 'Bacterioscopia (Gram)',
  'BAAR (Pesquisa de Bacilo Álcool-Ácido Resistente)', 'Cultura para Micobactérias',
  'Pesquisa de Fungos (KOH)', 'Cultura para Fungos',
  'Pesquisa de Streptococcus (Teste Rápido)', 'Swab Nasal (MRSA)',
  // ── Genética e Molecular ──
  'Cariótipo', 'Cariótipo com Banda G',
  'PCR para COVID-19', 'PCR para Influenza', 'PCR para Tuberculose (GeneXpert)',
  'Genotipagem HLA', 'Teste de Paternidade (DNA)',
  'NIPT (Teste Pré-Natal Não Invasivo)', 'BRCA1/BRCA2',
  'Pesquisa de Mutação JAK2', 'BCR-ABL (Leucemia Mieloide Crônica)',
  'Teste Farmacogenômico',
  // ── Líquidos Corporais ──
  'Líquor (Análise Completa)', 'Líquido Pleural (Análise)', 'Líquido Ascítico (Análise)',
  'Líquido Sinovial (Análise)', 'Líquido Pericárdico (Análise)',
  // ── Imagem – Raio-X ──
  'Raio-X Tórax PA', 'Raio-X Tórax PA e Perfil', 'Raio-X Coluna Cervical',
  'Raio-X Coluna Torácica', 'Raio-X Coluna Lombar', 'Raio-X Coluna Lombossacra',
  'Raio-X Bacia/Pelve', 'Raio-X Quadril', 'Raio-X Joelho', 'Raio-X Tornozelo', 'Raio-X Pé',
  'Raio-X Ombro', 'Raio-X Cotovelo', 'Raio-X Punho', 'Raio-X Mão',
  'Raio-X Seios da Face', 'Raio-X Crânio', 'Raio-X Abdome (Simples)',
  'Raio-X Abdome (Agudo)', 'Raio-X Panorâmico (Odontológico)',
  'Raio-X Idade Óssea',
  // ── Imagem – Ultrassonografia ──
  'Ultrassom Abdominal Total', 'Ultrassom Abdominal Superior', 'Ultrassom Pélvico',
  'Ultrassom Transvaginal', 'Ultrassom Obstétrico (1º Trimestre)',
  'Ultrassom Obstétrico (2º Trimestre)', 'Ultrassom Obstétrico (3º Trimestre)',
  'Ultrassom Obstétrico com Doppler', 'Ultrassom Morfológico',
  'Ultrassom de Tireoide', 'Ultrassom de Mama', 'Ultrassom de Próstata (Via Abdominal)',
  'Ultrassom de Próstata (Via Transretal)', 'Ultrassom de Bolsa Escrotal',
  'Ultrassom de Rins e Vias Urinárias', 'Ultrassom de Articulações',
  'Ultrassom de Partes Moles', 'Ultrassom de Parede Abdominal',
  'Ultrassom Doppler de Carótidas e Vertebrais', 'Ultrassom Doppler de Membros Inferiores (Venoso)',
  'Ultrassom Doppler de Membros Inferiores (Arterial)', 'Ultrassom Doppler de Membros Superiores',
  'Ultrassom Doppler de Aorta', 'Ultrassom Doppler Renal', 'Ultrassom Doppler Hepático',
  'Ultrassom Transfontanelar',
  // ── Imagem – Tomografia ──
  'TC Crânio (sem contraste)', 'TC Crânio (com contraste)', 'TC Seios da Face',
  'TC Tórax (sem contraste)', 'TC Tórax (com contraste)', 'TC Tórax Alta Resolução',
  'TC Abdome Total (sem contraste)', 'TC Abdome Total (com contraste)',
  'TC Pelve', 'TC Coluna Cervical', 'TC Coluna Lombar', 'TC Coluna Torácica',
  'Angiotomografia Coronariana', 'Angiotomografia Pulmonar',
  'Angiotomografia de Aorta', 'Angiotomografia Cerebral',
  'TC de Articulações (Joelho/Ombro/Quadril)',
  'Escore de Cálcio Coronariano',
  // ── Imagem – Ressonância Magnética ──
  'RM Crânio', 'RM Crânio com Espectroscopia', 'RM Sela Túrcica (Hipófise)',
  'RM Coluna Cervical', 'RM Coluna Torácica', 'RM Coluna Lombar', 'RM Coluna Lombossacra',
  'RM Joelho', 'RM Ombro', 'RM Quadril', 'RM Tornozelo', 'RM Punho',
  'RM Pelve', 'RM Abdome Superior', 'RM Mama (Bilateral)',
  'RM Cardíaca', 'RM Próstata (Multiparamétrica)',
  'Angiorressonância Cerebral', 'Angiorressonância de Aorta',
  'RM de Plexo Braquial', 'RM de Articulação Temporomandibular (ATM)',
  'Colangioressonância',
  // ── Imagem – Mamografia ──
  'Mamografia Bilateral', 'Mamografia Digital com Tomossíntese',
  'Densitometria Óssea (Coluna e Fêmur)', 'Densitometria Óssea (Corpo Total)',
  // ── Imagem – Medicina Nuclear ──
  'Cintilografia de Tireoide', 'Cintilografia Óssea', 'Cintilografia de Perfusão Miocárdica',
  'Cintilografia Renal (DMSA)', 'Cintilografia Renal (DTPA)',
  'Cintilografia Pulmonar (Ventilação/Perfusão)',
  'PET-CT (Corpo Inteiro)', 'PET-CT (Oncológico)',
  // ── Cardiologia ──
  'Eletrocardiograma (ECG)', 'Ecocardiograma Transtorácico', 'Ecocardiograma Transesofágico',
  'Ecocardiograma com Estresse', 'Ecocardiograma Fetal',
  'Teste Ergométrico', 'Teste Cardiopulmonar (Ergoespirometria)',
  'Holter 24h', 'Holter 48h', 'Holter 7 dias',
  'MAPA 24h', 'MRPA (Monitorização Residencial da PA)',
  'Tilt Test', 'Cateterismo Cardíaco', 'Estudo Eletrofisiológico',
  // ── Endoscopia e Procedimentos ──
  'Endoscopia Digestiva Alta', 'Endoscopia com Biópsia', 'Endoscopia com Pesquisa de H. pylori',
  'Colonoscopia', 'Colonoscopia com Biópsia', 'Colonoscopia com Polipectomia',
  'Retossigmoidoscopia', 'Cápsula Endoscópica',
  'Broncoscopia', 'Broncoscopia com Lavado Broncoalveolar',
  'Laringoscopia', 'Nasofibrolaringoscopia',
  'Cistoscopia', 'Histeroscopia Diagnóstica', 'Histeroscopia Cirúrgica',
  // ── Pneumologia ──
  'Espirometria', 'Espirometria com Broncodilatador', 'Pletismografia',
  'Teste de Broncoprovocação', 'Teste de Difusão (DLCO)',
  'Oximetria Noturna', 'Polissonografia (Tipo I)', 'Polissonografia (Tipo III)',
  // ── Neurologia ──
  'Eletroencefalograma (EEG)', 'EEG com Mapeamento Cerebral',
  'Eletroneuromiografia (ENMG)', 'Potencial Evocado Somatossensitivo',
  'Potencial Evocado Visual', 'Potencial Evocado Auditivo',
  // ── Otorrinolaringologia ──
  'Audiometria Tonal', 'Audiometria Vocal', 'Impedanciometria (Timpanometria)',
  'BERA (Potencial Evocado Auditivo de Tronco Encefálico)',
  'Emissões Otoacústicas (EOA)', 'Vectoeletronistagmografia (VENG)',
  'Videonistagmografia', 'Nasofibroscopia',
  // ── Oftalmologia ──
  'Acuidade Visual', 'Tonometria (Pressão Intraocular)', 'Campimetria Visual',
  'Fundoscopia', 'Retinografia', 'Angiofluoresceinografia',
  'OCT (Tomografia de Coerência Óptica)', 'Paquimetria',
  'Topografia Corneana', 'Biometria Ocular',
  'Gonioscopia', 'Teste de Schirmer',
  // ── Dermatologia ──
  'Dermatoscopia', 'Biópsia de Pele', 'Teste de Contato (Patch Test)',
  'Prick Test (Teste Cutâneo Alérgico)', 'Micológico Direto (Pele/Unha)',
  'Cultura para Fungos (Pele/Unha)',
  // ── Ginecologia e Obstetrícia ──
  'Citopatológico (Papanicolau)', 'Colposcopia', 'Vulvoscopia',
  'Captura Híbrida para HPV', 'Genotipagem de HPV',
  'Perfil Obstétrico (Painel)', 'Estreptococo do Grupo B (Swab)',
  'Pesquisa de Líquido Amniótico (Amniocentese)',
  // ── Urologia ──
  'Urodinâmica', 'Urofluxometria', 'PSA Ultrassensível',
  // ── Reumatologia ──
  'Pesquisa de Cristais (Líquido Sinovial)', 'Dosagem de Ácido Úrico 24h',
  // ── Alergia ──
  'Painel de Alérgenos Alimentares (IgE)', 'Painel de Alérgenos Inalantes (IgE)',
  'IgE Específica para Medicamentos',
  // ── Outros ──
  'Teste do Pezinho Ampliado', 'Teste da Orelhinha', 'Teste do Olhinho', 'Teste do Coraçãozinho',
  'Biópsia (com especificar local)', 'Punção Aspirativa por Agulha Fina (PAAF)',
  'Anatomopatológico', 'Imunohistoquímica',
];

interface FormData {
  paciente_id: string;
  medico_solicitante_id: string;
  tipo_exame: string;
  descricao: string;
  observacoes: string;
}

const initialFormData: FormData = {
  paciente_id: '',
  medico_solicitante_id: '',
  tipo_exame: '',
  descricao: '',
  observacoes: '',
};

export default function Exames() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customExameInput, setCustomExameInput] = useState('');
  const [newTypeInput, setNewTypeInput] = useState('');
  const [newTypeCat, setNewTypeCat] = useState('Personalizado');

  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();
  const { medicoId, isMedicoOnly } = useCurrentMedico();

  // Custom exam types from DB
  const { data: customTypesFromDB = [] } = useQuery({
    queryKey: ['tipos_exame_custom'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_exame_custom' as any)
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const TIPOS_EXAME = useMemo(() => {
    const customNames = customTypesFromDB.map((t: any) => t.nome);
    return [...new Set([...TIPOS_EXAME_DEFAULT, ...customNames])].sort();
  }, [customTypesFromDB]);

  const { data: exames = [], isLoading: loadingExames } = useQuery({
    queryKey: ['exames', isMedicoOnly, medicoId],
    queryFn: async () => {
      let query = supabase
        .from('exames')
        .select('*, pacientes(nome), medicos(crm, especialidade)')
        .order('data_solicitacao', { ascending: false });

      if (isMedicoOnly && medicoId) {
        query = query.eq('medico_solicitante_id', medicoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = loadingExames || loadingPacientes || loadingMedicos;

  const filteredExames = useMemo(() => {
    return exames.filter(e => {
      const paciente = (e as any).pacientes;
      const matchesSearch = 
        paciente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.tipo_exame.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [exames, searchTerm, statusFilter]);

  const selectedExame = useMemo(() => 
    exames.find(e => e.id === selectedId),
    [exames, selectedId]
  );

  const handleOpenNew = () => {
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleView = (id: string) => {
    setSelectedId(id);
    setIsViewOpen(true);
  };

  const handleSave = async () => {
    if (!formData.paciente_id || !formData.medico_solicitante_id || !formData.tipo_exame) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('exames').insert({
        paciente_id: formData.paciente_id,
        medico_solicitante_id: formData.medico_solicitante_id,
        tipo_exame: formData.tipo_exame,
        descricao: formData.descricao || null,
        observacoes: formData.observacoes || null,
        status: 'solicitado' as StatusExame,
        data_solicitacao: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
      
      toast.success('Exame solicitado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['exames'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao solicitar exame:', error);
      toast.error(error.message || 'Erro ao solicitar exame');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: StatusExame) => {
    try {
      const updateData: Record<string, any> = { status: newStatus };
      
      if (newStatus === 'realizado') {
        updateData.data_realizacao = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('exames')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['exames'] });
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const getPacienteNome = (exame: any) => {
    return exame.pacientes?.nome || 'Desconhecido';
  };

  const getMedicoInfo = (exame: any) => {
    const medico = exame.medicos;
    return medico ? `${medico.crm} - ${medico.especialidade || 'Clínico'}` : 'Desconhecido';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exames</h1>
          <p className="text-muted-foreground">Gerencie solicitações e resultados de exames</p>
        </div>
        <Button variant="outline" onClick={() => setIsManageTypesOpen(true)} className="gap-2">
          <FileText className="h-4 w-4" />
          Meus Tipos de Exame
        </Button>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Solicitar Exame
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exames ({filteredExames.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente ou exame..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Exame</TableHead>
                  <TableHead className="hidden md:table-cell">Solicitante</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum exame encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExames.map((exame) => (
                    <TableRow key={exame.id}>
                      <TableCell className="font-medium">{getPacienteNome(exame)}</TableCell>
                      <TableCell>{exame.tipo_exame}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {getMedicoInfo(exame)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {exame.data_solicitacao && format(new Date(exame.data_solicitacao), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(STATUS_COLORS[exame.status || 'solicitado'])}>
                          {STATUS_LABELS[exame.status || 'solicitado']}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleView(exame.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {exame.status === 'solicitado' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(exame.id, 'agendado')}
                            >
                              Agendar
                            </Button>
                          )}
                          {exame.status === 'agendado' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(exame.id, 'realizado')}
                            >
                              Realizado
                            </Button>
                          )}
                          {exame.status === 'realizado' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(exame.id, 'laudo_disponivel')}
                            >
                              Laudo OK
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Exam Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar Exame</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.paciente_id}
                onValueChange={(v) => setFormData({ ...formData, paciente_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Médico Solicitante *</Label>
              <Select
                value={formData.medico_solicitante_id}
                onValueChange={(v) => setFormData({ ...formData, medico_solicitante_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.crm} - {m.especialidade || 'Clínico'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Exame *</Label>
              <Select
                value={formData.tipo_exame}
                onValueChange={(v) => setFormData({ ...formData, tipo_exame: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o exame" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIPOS_EXAME.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  value={customExameInput}
                  onChange={(e) => setCustomExameInput(e.target.value)}
                  placeholder="Ou digite um tipo personalizado..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!customExameInput.trim()}
                  onClick={async () => {
                    const name = customExameInput.trim();
                    if (name && !TIPOS_EXAME.includes(name) && user) {
                      await supabase.from('tipos_exame_custom' as any).insert({ user_id: user.id, nome: name } as any);
                      queryClient.invalidateQueries({ queryKey: ['tipos_exame_custom'] });
                    }
                    setFormData({ ...formData, tipo_exame: name });
                    setCustomExameInput('');
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Informações adicionais sobre o exame..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações para o laboratório..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <LoadingButton onClick={handleSave} isLoading={isSubmitting} loadingText="Salvando...">
              Solicitar
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Exame</DialogTitle>
          </DialogHeader>
          {selectedExame && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium">{getPacienteNome(selectedExame)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={cn(STATUS_COLORS[selectedExame.status || 'solicitado'])}>
                    {STATUS_LABELS[selectedExame.status || 'solicitado']}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Exame</p>
                <p className="font-medium">{selectedExame.tipo_exame}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data Solicitação</p>
                  <p>{selectedExame.data_solicitacao && format(new Date(selectedExame.data_solicitacao), 'dd/MM/yyyy')}</p>
                </div>
                {selectedExame.data_realizacao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Data Realização</p>
                    <p>{format(new Date(selectedExame.data_realizacao), 'dd/MM/yyyy')}</p>
                  </div>
                )}
              </div>
              {selectedExame.descricao && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p>{selectedExame.descricao}</p>
                </div>
              )}
              {selectedExame.resultado && (
                <div>
                  <p className="text-sm text-muted-foreground">Resultado</p>
                  <p className="whitespace-pre-wrap">{selectedExame.resultado}</p>
                </div>
              )}
              {selectedExame.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p>{selectedExame.observacoes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Custom Types Dialog */}
      <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Meus Tipos de Exame</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                value={newTypeInput}
                onChange={e => setNewTypeInput(e.target.value)}
                placeholder="Nome do tipo de exame..."
                className="flex-1"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && newTypeInput.trim() && user) {
                    await supabase.from('tipos_exame_custom' as any).insert({ user_id: user.id, nome: newTypeInput.trim(), categoria: newTypeCat } as any);
                    queryClient.invalidateQueries({ queryKey: ['tipos_exame_custom'] });
                    setNewTypeInput('');
                    toast.success('Tipo de exame cadastrado!');
                  }
                }}
              />
              <Button
                disabled={!newTypeInput.trim()}
                onClick={async () => {
                  if (!newTypeInput.trim() || !user) return;
                  await supabase.from('tipos_exame_custom' as any).insert({ user_id: user.id, nome: newTypeInput.trim(), categoria: newTypeCat } as any);
                  queryClient.invalidateQueries({ queryKey: ['tipos_exame_custom'] });
                  setNewTypeInput('');
                  toast.success('Tipo de exame cadastrado!');
                }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            {customTypesFromDB.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Nenhum tipo personalizado cadastrado ainda</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {customTypesFromDB.map((tipo: any) => (
                  <div key={tipo.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium text-sm">{tipo.nome}</p>
                      <p className="text-xs text-muted-foreground">{tipo.categoria}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-7"
                      onClick={async () => {
                        await supabase.from('tipos_exame_custom' as any).delete().eq('id', tipo.id);
                        queryClient.invalidateQueries({ queryKey: ['tipos_exame_custom'] });
                        toast.success('Tipo removido');
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageTypesOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
