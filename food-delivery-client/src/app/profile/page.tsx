'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShoppingBag, Heart, Settings, ChevronRight, MessageCircle, FileText, Shield, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { supportAPI, SupportSettings } from '@/lib/api';
import showToast from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';
import { logger } from '@/lib/logger';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isHydrated, logout, isAuthenticated } = useAuthStore();
  const { status } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [supportSettings, setSupportSettings] = useState<SupportSettings | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasTokens, setHasTokens] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      setHasTokens(!!access && !!refresh);
    } catch {
      setHasTokens(false);
    }
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (isHydrated && !isAuthenticated && status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [isMounted, isHydrated, isAuthenticated, status, router]);

  useEffect(() => {
    const loadSupportSettings = async () => {
      try {
        const settings = await supportAPI.getSettings();
        setSupportSettings(settings);
      } catch (error) {
        logger.error('Ошибка загрузки настроек поддержки:', error);
        // Используем значения по умолчанию при ошибке
        setSupportSettings({
          id: 0,
          telegram_username: 'your_support_bot',
          telegram_link: 'https://t.me/your_support_bot',
          is_active: true
        });
      }
    };

    if (isMounted) {
      loadSupportSettings();
    }
  }, [isMounted]);

  const handleLogout = async () => {
    await logout();
    showToast.success('Вы вышли из аккаунта');
    router.push('/');
  };

  const handleSupportClick = () => {
    if (!supportSettings) return;
    
    const telegramUsername = supportSettings.telegram_username;
    
    // Для мобильных устройств откроется приложение, для десктопа — веб-версия
    window.location.href = `tg://resolve?domain=${telegramUsername}`;
    
    // Fallback на веб-версию, если приложение не открылось (через 1.5 секунды)
    setTimeout(() => {
      window.open(supportSettings.telegram_link, '_blank');
    }, 1500);
  };

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

  // Ждём авторизацию: если NextAuth ещё не авторизовал, а store тоже пустой,
  // показываем индикатор (особенно когда есть токены и ждём AuthSync)
  if (isMounted && isHydrated && !isAuthenticated && status !== 'authenticated') {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Входим...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Профиль</h1>
              <p className="text-gray-500 text-xs">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Menu Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => router.push('/orders')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Мои заказы</p>
                <p className="text-xs text-gray-500">История покупок</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          <button
            onClick={() => router.push('/favorites')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Избранное</p>
                <p className="text-xs text-gray-500">Любимые товары</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Support */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={handleSupportClick}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Связаться с поддержкой</p>
                <p className="text-xs text-gray-500">Telegram чат</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => router.push('/settings')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Настройки</p>
                <p className="text-xs text-gray-500">Параметры аккаунта</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Legal Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Правовые документы</h3>
          </div>
          
          <button
            onClick={() => router.push('/offer')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Публичная оферта</p>
                <p className="text-xs text-gray-500">Условия оказания услуг</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </button>

          <button
            onClick={() => router.push('/terms')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Пользовательское соглашение</p>
                <p className="text-xs text-gray-500">Правила использования</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </button>

          <button
            onClick={() => router.push('/privacy')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Политика конфиденциальности</p>
                <p className="text-xs text-gray-500">Обработка данных</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-white rounded-2xl shadow-sm border border-red-200 p-4 hover:bg-red-50 transition-colors"
        >
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <LogOut className="h-5 w-5" />
            <span className="font-semibold">Выйти из аккаунта</span>
          </div>
        </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Выйти из аккаунта?"
        message="Вы действительно хотите выйти? Ваша корзина и избранное будут сохранены."
        confirmText="Да, выйти"
        cancelText="Отмена"
        type="warning"
      />
    </div>
  );
}

