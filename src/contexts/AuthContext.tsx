import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { getItem, setItem, removeItem, getAll } from '@/lib/localStorage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: (User & { senha: string })[] = [
  {
    id: '1',
    nome: 'Dr. Carlos Silva',
    email: 'admin@elolab.com',
    role: 'admin',
    ativo: true,
    criadoEm: new Date().toISOString(),
    senha: 'admin123',
  },
  {
    id: '2',
    nome: 'Dra. Ana Souza',
    email: 'medico@elolab.com',
    role: 'medico',
    crm: '12345-SP',
    especialidade: 'Clínica Geral',
    ativo: true,
    criadoEm: new Date().toISOString(),
    senha: 'medico123',
  },
  {
    id: '3',
    nome: 'Maria Oliveira',
    email: 'recepcao@elolab.com',
    role: 'recepcao',
    ativo: true,
    criadoEm: new Date().toISOString(),
    senha: 'recepcao123',
  },
  {
    id: '4',
    nome: 'João Santos',
    email: 'financeiro@elolab.com',
    role: 'financeiro',
    ativo: true,
    criadoEm: new Date().toISOString(),
    senha: 'financeiro123',
  },
  {
    id: '5',
    nome: 'Enfermeira Paula',
    email: 'enfermagem@elolab.com',
    role: 'enfermagem',
    ativo: true,
    criadoEm: new Date().toISOString(),
    senha: 'enfermagem123',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize mock users if not exists
    const existingUsers = getAll<User & { senha: string }>('users');
    if (existingUsers.length === 0) {
      setItem('users', MOCK_USERS);
    }

    // Check for existing session
    const savedUser = getItem<User>('currentUser');
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    const users = getAll<User & { senha: string }>('users');
    const foundUser = users.find(u => u.email === email && u.senha === senha && u.ativo);

    if (foundUser) {
      const { senha: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      setItem('currentUser', userWithoutPassword);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    removeItem('currentUser');
  };

  const hasPermission = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
