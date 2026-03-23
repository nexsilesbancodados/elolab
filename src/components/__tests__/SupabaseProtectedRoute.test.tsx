import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SupabaseProtectedRoute } from '@/components/SupabaseProtectedRoute';

// Mock useSupabaseAuth
const mockUseSupabaseAuth = vi.fn();
vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useSupabaseAuth: () => mockUseSupabaseAuth(),
  // Re-export types
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('SupabaseProtectedRoute', () => {
  it('mostra loading quando isLoading', () => {
    mockUseSupabaseAuth.mockReturnValue({
      user: null,
      profile: null,
      isLoading: true,
      hasAnyRole: () => false,
    });
    renderWithRouter(
      <SupabaseProtectedRoute>
        <div>Protected</div>
      </SupabaseProtectedRoute>
    );
    // Should show spinner, not content
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('redireciona para /auth sem usuário', () => {
    mockUseSupabaseAuth.mockReturnValue({
      user: null,
      profile: null,
      isLoading: false,
      hasAnyRole: () => false,
    });
    renderWithRouter(
      <SupabaseProtectedRoute>
        <div>Protected</div>
      </SupabaseProtectedRoute>
    );
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('mostra tela pendente sem roles', () => {
    mockUseSupabaseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      profile: { roles: [] },
      isLoading: false,
      hasAnyRole: () => false,
    });
    renderWithRouter(
      <SupabaseProtectedRoute>
        <div>Protected</div>
      </SupabaseProtectedRoute>
    );
    expect(screen.getByText('Acesso Pendente')).toBeInTheDocument();
  });

  it('mostra acesso negado com role errada', () => {
    mockUseSupabaseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      profile: { roles: ['medico'] },
      isLoading: false,
      hasAnyRole: () => false,
    });
    renderWithRouter(
      <SupabaseProtectedRoute allowedRoles={['admin' as any]}>
        <div>Protected</div>
      </SupabaseProtectedRoute>
    );
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
  });

  it('renderiza children com role correta', () => {
    mockUseSupabaseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      profile: { roles: ['admin'] },
      isLoading: false,
      hasAnyRole: () => true,
    });
    renderWithRouter(
      <SupabaseProtectedRoute allowedRoles={['admin' as any]}>
        <div>Protected</div>
      </SupabaseProtectedRoute>
    );
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('renderiza children sem allowedRoles definido', () => {
    mockUseSupabaseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      profile: { roles: ['medico'] },
      isLoading: false,
      hasAnyRole: () => true,
    });
    renderWithRouter(
      <SupabaseProtectedRoute>
        <div>Protected</div>
      </SupabaseProtectedRoute>
    );
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });
});
