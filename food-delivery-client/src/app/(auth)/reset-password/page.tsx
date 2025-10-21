'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearchParams();
  const email = useMemo(() => search.get('email') || '', [search]);
  const [manualEmail, setManualEmail] = useState('');
  const effectiveEmail = manualEmail || email;

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!effectiveEmail) { setError('Введите email'); return; }
    if (!/^\d{6}$/.test(code)) { setError('Введите 6-значный код'); return; }
    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    try {
      const r = await authAPI.passwordReset(effectiveEmail, code, password);
      if (r?.status === 'ok') {
        setInfo('Пароль обновлён, вход...');
        router.replace('/login');
      } else {
        setError('Не удалось обновить пароль');
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail || '';
      setError(detail === 'INVALID_CODE' ? 'Неверный или истекший код' : 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(''); setInfo('');
    if (!effectiveEmail) { setError('Введите email'); return; }
    setResending(true);
    try {
      await authAPI.passwordResend(effectiveEmail);
      setInfo('Код отправлен повторно');
    } catch {
      setError('Ошибка при отправке кода');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Сброс пароля</h1>
            <p className="text-gray-600">Введите код и новый пароль</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {info && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{info}</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              {!email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="w-full py-3 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Код</label>
                <input
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center tracking-widest text-xl py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Новый пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Подтверждение пароля</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full py-3 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !effectiveEmail}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Сбрасываем...' : 'Обновить пароль'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <button onClick={resend} disabled={resending} className="text-green-600 hover:text-green-700 font-semibold disabled:opacity-50">{resending ? 'Отправляем...' : 'Отправить код ещё раз'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


