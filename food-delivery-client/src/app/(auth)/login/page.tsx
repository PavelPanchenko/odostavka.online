'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import NextAuthGoogleButton from '@/components/NextAuthGoogleButton';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { useSession } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (process.env.NODE_ENV === 'development') console.log('🔐 Авторизация через email/password с NextAuth');
      
      // Используем NextAuth signIn с credentials provider
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (process.env.NODE_ENV === 'development') console.log('📋 Результат NextAuth signIn:', result);

      if (result?.error) {
        const raw = String(result.error || '');
        if (raw.includes('EMAIL_NOT_VERIFIED')) {
          console.warn('⚠️ Email не подтвержден, перенаправляем на ввод кода');
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        const message = getAuthErrorMessage(result.error);
        if (process.env.NODE_ENV === 'development') console.error('❌ Ошибка авторизации:', message);
        setError(message);
      } else if (result?.ok) {
        if (process.env.NODE_ENV === 'development') console.log('✅ Авторизация успешна, перенаправляем в профиль');
        router.replace('/profile');
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Ошибка при авторизации:', err);
      setError(err.message || 'Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    console.log('✅ Google авторизация успешна, перенаправляем в профиль');
    router.push('/profile');
  };

  const handleGoogleError = (error: string) => {
    setError(error);
    setGoogleLoading(false);
  };

  // Если уже авторизован, уходим с авторизационной страницы
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/profile');
      return;
    }
  }, [status, router]);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-8">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Вход</h1>
            <p className="text-gray-600">Войдите в свой аккаунт</p>
          </div>

          {/* Карточка формы */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* Ошибка */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Форма */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Пароль */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Кнопка входа */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Вход...
                  </span>
                ) : (
                  'Войти'
                )}
              </button>
            </form>

            {/* Разделитель */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">или</span>
              </div>
            </div>

            {/* Google вход */}
            <NextAuthGoogleButton
              onLoading={setGoogleLoading}
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />

            {/* Ссылка на регистрацию */}
            <p className="mt-6 text-center text-sm text-gray-600">
              Нет аккаунта?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-green-600 hover:text-green-700 font-semibold transition-colors"
              >
                Зарегистрироваться
              </button>
            </p>

            {/* Ссылка на восстановление пароля */}
            <p className="mt-3 text-center text-sm text-gray-600">
              Забыли пароль?{' '}
              <button
                onClick={() => router.push('/forgot-password')}
                className="text-green-600 hover:text-green-700 font-semibold transition-colors"
              >
                Восстановить
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

