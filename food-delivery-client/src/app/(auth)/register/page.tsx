'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Phone } from 'lucide-react';
import { signIn } from 'next-auth/react';
import NextAuthGoogleButton from '@/components/NextAuthGoogleButton';
import { authAPI } from '@/lib/api';
import { getAuthErrorMessage } from '@/lib/authErrors';
import showToast from '@/lib/toast';
import { useSession } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      const msg = 'Пароли не совпадают';
      setError(msg);
      showToast.error(msg);
      return;
    }

    if (formData.password.length < 6) {
      const msg = 'Пароль должен быть не менее 6 символов';
      setError(msg);
      showToast.error(msg);
      return;
    }

    if (!agreeToTerms) {
      const msg = 'Необходимо согласиться с условиями использования';
      setError(msg);
      showToast.error(msg);
      return;
    }

    setLoading(true);

    try {
      if (process.env.NODE_ENV === 'development') console.log('📝 Регистрация нового пользователя');
      
      // Регистрируем пользователя через ваш бэкенд
      const res = await authAPI.register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );
      // Если требуется подтверждение — ведем на страницу ввода кода
      if ((res as any)?.status === 'pending_verification') {
        const cooldown = 0;
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}&cooldown=${cooldown}`);
        return;
      }
      // Теоретически, если бэкенд вернул токены (на случай обратной совместимости)
      try {
        const resp = res as any;
        if (resp?.access_token && resp?.refresh_token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', resp.access_token);
            localStorage.setItem('refresh_token', resp.refresh_token);
          }
          router.push('/profile');
          return;
        }
      } catch {}
      // Фолбэк
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Ошибка регистрации. Попробуйте снова.';
      setError(msg);
      showToast.error(msg);
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

  // Если уже авторизован, не держим на странице регистрации
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/profile');
    }
  }, [status, router]);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-8">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Регистрация</h1>
            <p className="text-gray-600">Создайте новый аккаунт</p>
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
              {/* Имя */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Полное имя
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Иван Иванов"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Телефон */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон (необязательно)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="+7 (999) 123-45-67"
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
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
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

              {/* Подтверждение пароля */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Согласие с условиями */}
              <div className="flex items-start">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-600">
                  Я согласен с{' '}
                  <a href="/terms" className="text-green-600 hover:text-green-700 underline">
                    условиями использования
                  </a>{' '}
                  и{' '}
                  <a href="/privacy" className="text-green-600 hover:text-green-700 underline">
                    политикой конфиденциальности
                  </a>
                </label>
              </div>

              {/* Кнопка регистрации */}
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
                    Регистрация...
                  </span>
                ) : (
                  'Зарегистрироваться'
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

            {/* Ссылка на вход */}
            <p className="mt-6 text-center text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-green-600 hover:text-green-700 font-semibold transition-colors"
              >
                Войти
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

