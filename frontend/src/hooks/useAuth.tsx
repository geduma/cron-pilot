import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { authApi } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (providerId: string) => Promise<void>;
  logout: () => void;
  handleCallback: (sessionToken: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const sessionToken = localStorage.getItem('session_token');

    if (storedUser && sessionToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('session_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (providerId: string) => {
    const redirectUrl = await authApi.login(providerId);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  const logout = () => {
    setUser(null);
    authApi.logout();
  };

  const handleCallback = useCallback(async (sessionToken: string): Promise<boolean> => {
    const response = await authApi.getSession(sessionToken);

    if (response?.ok && response.data) {
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('session_token', sessionToken);
      return true;
    }

    return false;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        handleCallback
      }}
    >
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
