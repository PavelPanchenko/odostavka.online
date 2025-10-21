'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

interface NextAuthGoogleButtonProps {
  onLoading?: (loading: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function NextAuthGoogleButton({ 
  onLoading, 
  onSuccess,
  onError
}: NextAuthGoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      onLoading?.(true);
      
      if (process.env.NODE_ENV === 'development') console.log('🚀 Начинаем авторизацию через Google...');
      
      // Используем NextAuth.js для авторизации через Google
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/'
      });

      if (process.env.NODE_ENV === 'development') console.log('📋 Результат NextAuth signIn:', result);

      if (result?.error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Ошибка NextAuth:', result.error);
        onError?.(result.error);
        setIsLoading(false);
        onLoading?.(false);
      } else if (result?.ok) {
        if (process.env.NODE_ENV === 'development') console.log('✅ Google авторизация успешна');
        onSuccess?.();
      }
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Ошибка авторизации через Google:', error);
      onError?.((error as Error).message || 'Ошибка авторизации через Google');
      setIsLoading(false);
      onLoading?.(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-3 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span className="text-sm font-medium">
          {isLoading ? 'Загрузка...' : 'Войти через Google'}
        </span>
      </button>
    </div>
  );
}
