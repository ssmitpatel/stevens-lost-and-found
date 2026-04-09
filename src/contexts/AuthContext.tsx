import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, mockUsers } from '@/data/mock-data';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string) => {
    if (!email.endsWith('@stevens.edu')) return false;
    const found = mockUsers.find(u => u.email === email) || {
      id: 'u_new',
      email,
      name: email.split('@')[0],
      role: 'student' as UserRole,
    };
    setUser(found);
    return true;
  };

  const logout = () => setUser(null);

  const switchRole = (role: UserRole) => {
    if (user) setUser({ ...user, role });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
