import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState, EmptyPatients, NoResults } from '@/components/EmptyState';
import { Users } from 'lucide-react';

describe('EmptyState', () => {
  it('renderiza título e descrição', () => {
    render(<EmptyState title="Vazio" description="Nenhum item encontrado" />);
    expect(screen.getByText('Vazio')).toBeInTheDocument();
    expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
  });

  it('renderiza botão de ação', async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Vazio"
        description="Desc"
        action={{ label: 'Adicionar', onClick, icon: Users }}
      />
    );
    const btn = screen.getByText('Adicionar');
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renderiza ação secundária', async () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    render(
      <EmptyState
        title="Vazio"
        description="Desc"
        action={{ label: 'Primário', onClick: onPrimary }}
        secondaryAction={{ label: 'Secundário', onClick: onSecondary }}
      />
    );
    await userEvent.click(screen.getByText('Secundário'));
    expect(onSecondary).toHaveBeenCalledOnce();
  });

  it('renderiza children', () => {
    render(
      <EmptyState title="T" description="D">
        <span>Custom child</span>
      </EmptyState>
    );
    expect(screen.getByText('Custom child')).toBeInTheDocument();
  });
});

describe('EmptyPatients', () => {
  it('renderiza preset de pacientes', () => {
    render(<EmptyPatients onAdd={vi.fn()} />);
    expect(screen.getByText('Nenhum paciente cadastrado')).toBeInTheDocument();
    expect(screen.getByText('Cadastrar Paciente')).toBeInTheDocument();
  });
});

describe('NoResults', () => {
  it('renderiza com termo de busca', () => {
    render(<NoResults searchTerm="teste" />);
    expect(screen.getByText(/teste/)).toBeInTheDocument();
  });
});
