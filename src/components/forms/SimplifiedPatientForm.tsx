import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { MaskedInput } from '@/components/ui/masked-input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PatientFormData {
  // Campos obrigatórios (essenciais)
  nome: string;
  cpf: string;
  telefone: string;
  data_nascimento: string;
  // Campos opcionais (colapsáveis)
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  alergias: string[];
  observacoes: string;
}

interface SimplifiedPatientFormProps {
  initialData?: Partial<PatientFormData>;
  onSubmit: (data: PatientFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function SimplifiedPatientForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: SimplifiedPatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    nome: initialData?.nome || '',
    cpf: initialData?.cpf || '',
    telefone: initialData?.telefone || '',
    data_nascimento: initialData?.data_nascimento || '',
    email: initialData?.email || '',
    cep: initialData?.cep || '',
    logradouro: initialData?.logradouro || '',
    numero: initialData?.numero || '',
    bairro: initialData?.bairro || '',
    cidade: initialData?.cidade || '',
    estado: initialData?.estado || '',
    alergias: initialData?.alergias || [],
    observacoes: initialData?.observacoes || '',
  });

  const [showOptional, setShowOptional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof PatientFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Campos obrigatórios - sempre visíveis */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          Informações Essenciais
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-1">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              placeholder="Nome completo do paciente"
              aria-required="true"
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? 'nome-error' : undefined}
              className={cn(errors.nome && 'border-destructive')}
            />
            {errors.nome && (
              <p id="nome-error" className="text-xs text-destructive" role="alert">
                {errors.nome}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <MaskedInput
              id="cpf"
              mask="cpf"
              value={formData.cpf}
              onChange={(value) => updateField('cpf', value)}
              placeholder="000.000.000-00"
              aria-required="true"
              aria-invalid={!!errors.cpf}
              className={cn(errors.cpf && 'border-destructive')}
            />
            {errors.cpf && (
              <p className="text-xs text-destructive" role="alert">
                {errors.cpf}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <MaskedInput
              id="telefone"
              mask="phone"
              value={formData.telefone}
              onChange={(value) => updateField('telefone', value)}
              placeholder="(00) 00000-0000"
              aria-required="true"
              aria-invalid={!!errors.telefone}
              className={cn(errors.telefone && 'border-destructive')}
            />
            {errors.telefone && (
              <p className="text-xs text-destructive" role="alert">
                {errors.telefone}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => updateField('data_nascimento', e.target.value)}
              aria-required="true"
              aria-invalid={!!errors.data_nascimento}
              className={cn(errors.data_nascimento && 'border-destructive')}
            />
            {errors.data_nascimento && (
              <p className="text-xs text-destructive" role="alert">
                {errors.data_nascimento}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Campos opcionais - colapsáveis */}
      <Collapsible open={showOptional} onOpenChange={setShowOptional}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              Informações Adicionais (opcional)
            </span>
            {showOptional ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          {/* Contato adicional */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Endereço simplificado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <MaskedInput
                id="cep"
                mask="cep"
                value={formData.cep}
                onChange={(value) => updateField('cep', value)}
                placeholder="00000-000"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cidade">Cidade/Estado</Label>
              <div className="flex gap-2">
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => updateField('cidade', e.target.value)}
                  placeholder="Cidade"
                  className="flex-1"
                />
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => updateField('estado', e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                  className="w-16"
                />
              </div>
            </div>
          </div>

          {/* Informações clínicas */}
          <div className="space-y-2">
            <Label htmlFor="alergias">Alergias</Label>
            <Input
              id="alergias"
              value={formData.alergias.join(', ')}
              onChange={(e) =>
                updateField(
                  'alergias',
                  e.target.value
                    .split(',')
                    .map((a) => a.trim())
                    .filter(Boolean)
                )
              }
              placeholder="Penicilina, Dipirona, etc. (separadas por vírgula)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => updateField('observacoes', e.target.value)}
              placeholder="Observações sobre o paciente..."
              rows={3}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Ações */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <LoadingButton onClick={handleSubmit} isLoading={isSubmitting} loadingText="Salvando...">
          {isEditing ? 'Atualizar' : 'Cadastrar'}
        </LoadingButton>
      </div>
    </div>
  );
}
