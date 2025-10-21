'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { signIn } from 'next-auth/react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const search = useSearchParams();
  const email = useMemo(() => search.get('email') || '', [search]);
  const [manualEmail, setManualEmail] = useState('');

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState('');

  useEffect(() => {
    const p = parseInt(search.get('cooldown') || '0', 10);
    if (p > 0) setResendCooldown(p);
  }, [search]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const effectiveEmail = useMemo(() => manualEmail || email, [manualEmail, email]);

  const maskedEmail = useMemo(() => {
    if (!effectiveEmail) return '';
    const [name, domain] = effectiveEmail.split('@');
    const head = name.slice(0, 2);
    return `${head}***@${domain}`;
  }, [effectiveEmail]);

  const confirm = async () => {
    try {
      console.log('[verify-email] confirm clicked');
    } catch {}
    setError('');
    setInfo('');
    const emailToUse = effectiveEmail?.trim();
    const codeToUse = code.trim();
    if (!emailToUse) {
      setError('Неизвестный email');
      return;
    }
    if (!/^\d{6}$/.test(codeToUse)) {
      setError('Введите 6-значный код');
      return;
    }
    setLoading(true);
    try {
      console.log('[verify-email] sending request', { emailToUse, codeLength: codeToUse.length });
      const resp = await authAPI.verifyEmail(emailToUse, codeToUse);
      console.log('[verify-email] success');
      await signIn('backendTokens', {
        id: resp.user?.id,
        email: resp.user?.email,
        name: resp.user?.name,
        username: resp.user?.username,
        access_token: resp.access_token,
        refresh_token: resp.refresh_token,
        redirect: false,
      });
      router.replace('/profile');
    } catch (err: any) {
      console.error('[verify-email] error', err?.response?.status, err?.response?.data);
      const detail = err?.response?.data?.detail || '';
      if (detail === 'INVALID_CODE') setError('Неверный или истекший код');
      else setError('Не удалось подтвердить email');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await confirm();
  };

  const resend = async () => {
    setError('');
    setInfo('');
    if (!effectiveEmail) {
      setError('Введите email');
      return;
    }
    setResending(true);
    try {
      const resp = await authAPI.resendVerification(effectiveEmail);
      if (resp?.status === 'ok') {
        setInfo('Код отправлен повторно');
        setResendCooldown(60);
      } else if (resp?.status === 'already_verified') {
        router.replace('/login');
      } else {
        setError('Не удалось отправить код');
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 429) setError('Слишком часто. Попробуйте позже.');
      else setError('Ошибка при отправке кода');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Подтверждение email</h1>
            <p className="text-gray-600">Мы отправили код на {maskedEmail}</p>
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

            <form onSubmit={submit} noValidate className="space-y-5">
              {!email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value.trim())}
                    className="w-full py-3 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Код из письма</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onInput={(e: any) => setCode(String(e.currentTarget.value || '').replace(/\D/g, '').slice(0, 6))}
                  onPaste={(e) => {
                    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0,6);
                    if (text) {
                      e.preventDefault();
                      setCode(text);
                    }
                  }}
                  className="w-full text-center tracking-widest text-xl py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="000000"
                />
              </div>

              <button
                type="button"
                onClick={confirm}
                disabled={loading || !effectiveEmail || code.length !== 6}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Подтверждаем...' : 'Подтвердить'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <button
                onClick={resend}
                disabled={resendCooldown > 0 || resending}
                className="text-green-600 hover:text-green-700 font-semibold disabled:opacity-50"
              >
                {resending
                  ? 'Отправляем...'
                  : resendCooldown > 0
                  ? `Отправить код ещё раз через ${resendCooldown}с`
                  : 'Отправить код ещё раз'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


