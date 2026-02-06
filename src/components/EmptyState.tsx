import { ReactNode } from 'react';
import { LucideIcon, FileQuestion, Users, Calendar, FileText, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground max-w-md">{description}</p>
        </div>
        {(action || secondaryAction || children) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {action && (
              <Button onClick={action.onClick}>
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
            {children}
          </div>
        )}
      </div>
    </Card>
  );
}

// Preset empty states for common use cases
export function EmptyPatients({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum paciente cadastrado"
      description="Comece cadastrando seu primeiro paciente para gerenciar consultas e prontuários."
      action={{
        label: 'Cadastrar Paciente',
        onClick: onAdd,
        icon: Users,
      }}
    />
  );
}

export function EmptyAgendamentos({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="Nenhum agendamento"
      description="A agenda está vazia. Clique em um horário disponível para criar um novo agendamento."
      action={{
        label: 'Novo Agendamento',
        onClick: onAdd,
        icon: Calendar,
      }}
    />
  );
}

export function EmptyProntuarios({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="Nenhum prontuário"
      description="Não há prontuários registrados. Crie um novo prontuário após uma consulta."
      action={{
        label: 'Novo Prontuário',
        onClick: onAdd,
        icon: FileText,
      }}
    />
  );
}

export function EmptyEstoque({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="Estoque vazio"
      description="Nenhum item cadastrado no estoque. Adicione materiais e medicamentos."
      action={{
        label: 'Adicionar Item',
        onClick: onAdd,
        icon: Package,
      }}
    />
  );
}

export function NoResults({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Nenhum resultado encontrado"
      description={`Não encontramos resultados para "${searchTerm}". Tente buscar com outros termos.`}
    />
  );
}
