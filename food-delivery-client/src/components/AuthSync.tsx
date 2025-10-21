'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/auth';
import { authAPI } from '@/lib/api';
import { signOut } from 'next-auth/react';

/**
 * Компонент для синхронизации NextAuth сессии с Zustand store
 */
export default function AuthSync() {
  const { data: session, status } = useSession();
  const { setUser, setAuthenticated } = useAuthStore();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') console.log('🔄 AuthSync: статус сессии -', status);
    
    if (status === 'authenticated' && session) {
      if (process.env.NODE_ENV === 'development') console.log('✅ AuthSync: пользователь авторизован', (session as any)?.user);
      
      const backendAccessToken = (session as any)?.backend_access_token as string | undefined;
      const backendRefreshToken = (session as any)?.backend_refresh_token as string | undefined;
      const hasBackendTokens = !!(backendAccessToken && backendRefreshToken);

      if (hasBackendTokens) {
        // Сохраняем токены и грузим профиль из API
        localStorage.setItem('access_token', backendAccessToken as string);
        localStorage.setItem('refresh_token', backendRefreshToken as string);
        if (process.env.NODE_ENV === 'development') console.log('✅ AuthSync: токены сохранены в localStorage');

        authAPI.getMe()
          .then((me) => {
            const userData = {
              id: me.id,
              email: me.email,
              username: me.username,
              name: (me as any).name ?? (me as any).full_name ?? '',
              phone: (me as any).phone,
              address: (me as any).address,
              telegram_user_id: (me as any).telegram_user_id,
            };
            setUser(userData);
            setAuthenticated(true);
            if (process.env.NODE_ENV === 'development') console.log('✅ AuthSync: профиль загружен из API');
          })
          .catch((err) => {
            if (process.env.NODE_ENV === 'development') console.warn('⚠️ AuthSync: getMe failed, выходим из аккаунта', err);
            // Токены есть, но бэкенд не принял — считаем сессию недействительной
            try {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
            } catch {}
            setUser(null);
            setAuthenticated(false);
            // Разлогиниваем NextAuth, чтобы статус стал unauthenticated
            signOut({ redirect: false }).catch(() => {});
          });
      } else {
        // Нет backend-токенов — не дергаем защищённые эндпоинты, используем данные из сессии
        const sUser: any = (session as any)?.user || {};
        const fallbackUser = {
          id: parseInt(String(sUser.id)) || 0,
          email: sUser.email || '',
          username: sUser.username || sUser.email?.split('@')[0] || '',
          name: sUser.name || '',
          phone: undefined,
          address: undefined,
        };
        setUser(fallbackUser);
        setAuthenticated(true);
      }
    } else if (status === 'unauthenticated') {
      // При полной унификации на NextAuth избегаем авторизации по localStorage токенам
      setUser(null);
      setAuthenticated(false);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }, [session, status, setUser, setAuthenticated]);

  return null; // Этот компонент не рендерит ничего
}

