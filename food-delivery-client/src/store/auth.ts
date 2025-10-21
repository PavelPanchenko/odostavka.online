/**
 * Store для управления аутентификацией
 * Теперь работает в связке с NextAuth.js
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserResponse } from '@/lib/api';

interface AuthStore {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  
  // Действия
  setUser: (user: UserResponse | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      setUser: (user: UserResponse | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },

      setAuthenticated: (isAuthenticated: boolean) => {
        set({ isAuthenticated });
      },

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },

      logout: async () => {
        console.log('🚪 Выход из системы');
        
        if (typeof window !== 'undefined') {
          // Очищаем localStorage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('universal-cart-storage');
          
          // Выходим из NextAuth.js сессии (без динамического импорта, чтобы избежать ChunkLoadError)
          try {
            const { signOut } = await import('next-auth/react');
            await signOut({ redirect: false });
          } catch (error) {
            console.error('❌ Ошибка при выходе из NextAuth.js:', error);
          }
        }
        
        // Очищаем store
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 Auth: Rehydrating from storage');
        if (state) {
          state.setHydrated(true);
          console.log('✅ Auth: Hydration complete', {
            hasUser: !!state.user,
            isAuthenticated: state.isAuthenticated
          });
        }
      },
    }
  )
);
