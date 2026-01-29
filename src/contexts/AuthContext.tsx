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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = getItem<User>('currentUser');
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    // Get users from localStorage (seeded by seedData)
    const users = getAll<User & { senha?: string }>('users');
    
    // Find user with matching email and password
    const foundUser = users.find(u => {
      // Check password stored in user object
      if ('senha' in u && u.senha === senha && u.email === email && u.ativo) {
        return true;
      }
      return false;
    });

    if (foundUser) {
      // Remove password from user object before storing in session
      const { senha: _, ...userWithoutPassword } = foundUser as User & { senha?: string };
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
