'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Phone, User as UserIcon, Navigation } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useSession } from 'next-auth/react';
import { authAPI } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, isAuthenticated, isHydrated, setUser } = useAuthStore();
  const { status } = useSession();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  // Telegram UI state
  const [chatId, setChatId] = useState('');
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [tgInfo, setTgInfo] = useState('');
  const [tgError, setTgError] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [isMounted, status, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      setChatId((user as any)?.telegram_user_id || '');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name }));
        setGettingLocation(false);
      } else {
        throw new Error('Адрес не найден');
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, address: 'Москва, Красная площадь, 1' }));
      setGettingLocation(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером');
      return;
    }
    setGettingLocation(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await getAddressFromCoords(latitude, longitude);
      },
      async (error) => {
        if (error.code === error.POSITION_UNAVAILABLE || error.code === 2) {
          await getAddressFromCoords(55.7558, 37.6173);
          return;
        }
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Доступ к геолокации запрещен. Разрешите доступ в настройках браузера');
            break;
          case error.TIMEOUT:
            setError('Превышено время ожидания определения местоположения');
            break;
          default:
            setError('Не удалось определить местоположение. Введите адрес вручную');
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const updatedUser = await authAPI.updateProfile(formData);
      setUser(updatedUser);
      // Если указан Telegram chat_id, сохраняем его вместе с общими настройками
      if (chatId.trim()) {
        try {
          await authAPI.registerTelegram(chatId.trim());
          setTgInfo('Telegram chat_id сохранён');
          setTgError('');
        } catch {
          setTgError('Не удалось сохранить chat_id');
        }
      }
      setSuccess('Настройки успешно сохранены!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сохранения. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // Save Telegram chat_id manually
  const saveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgError(''); setTgInfo('');
    if (!chatId.trim()) { setTgError('Введите chat_id'); return; }
    setSavingTelegram(true);
    try {
      await authAPI.registerTelegram(chatId.trim());
      setTgInfo('Telegram chat_id сохранён');
    } catch {
      setTgError('Не удалось сохранить chat_id');
    } finally {
      setSavingTelegram(false);
    }
  };

  // Auto-bind from URL (tg_chat_id & sig)
  useEffect(() => {
    if (!isMounted) return;
    const tg = search.get('tg_chat_id');
    const sig = search.get('sig');
    if (tg) {
      (async () => {
        try {
          setSavingTelegram(true);
          if (sig) {
            await fetch('/api/v1/users/me/telegram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: tg, sig }),
            });
          } else {
            await authAPI.registerTelegram(tg);
          }
          setTgInfo('Telegram chat_id привязан');
          setTgError('');
        } catch {
          setTgError('Не удалось привязать chat_id');
        } finally {
          setSavingTelegram(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  if (!isMounted || !isHydrated) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center space-x-2.5">
            <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Настройки</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">{error}</div>
            )}

            {/* Email */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email (нельзя изменить)</label>
              <div className="text-gray-900">{user?.email}</div>
            </div>

            {/* Name */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Имя</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ваше имя" required className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Номер телефона</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+7 (999) 123-45-67" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Адрес доставки</label>
              <div className="relative">
                <button type="button" onClick={handleGetLocation} disabled={gettingLocation} className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 p-1 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 cursor-pointer" title="Определить мое местоположение" style={{ pointerEvents: 'auto' }}>
                  <Navigation className={`h-4 w-4 text-green-600 ${gettingLocation ? 'animate-spin' : ''}`} />
                </button>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Город, улица, дом, квартира" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
              </div>
            </div>

            {/* Telegram section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Telegram chat_id</label>
              {tgInfo && <div className="mb-2 text-green-700 text-xs">{tgInfo}</div>}
              {tgError && <div className="mb-2 text-red-600 text-xs">{tgError}</div>}
              <input type="text" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="Ваш chat_id" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <p className="text-[11px] text-gray-500 mt-2">Совет: откройте нашего бота, он пришлет ссылку и привяжет chat_id автоматически.</p>
            </div>

            {/* Save Button */}
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              <Save className="h-4 w-4" />
              <span>{loading ? 'Сохранение...' : 'Сохранить изменения'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

