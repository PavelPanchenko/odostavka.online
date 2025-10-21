'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import { UserResponse } from '@/lib/api';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  loginWithGoogle: (userInfo: { id: string; email: string; name: string; picture?: string; verified_email: boolean }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isHydrated, loginWithCredentials, register, logout, isLoading, loginWithGoogle } = useAuthStore();

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isHydrated,
      login: loginWithCredentials,
      register,
      loginWithGoogle,
      logout,
      loading: isLoading
    }}>
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
