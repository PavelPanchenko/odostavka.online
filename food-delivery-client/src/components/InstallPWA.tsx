'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Компонент для установки PWA
 * Показывает баннер с предложением установить приложение
 */
export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Проверяем, уже установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Слушаем событие beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Показываем промпт через 5 секунд после загрузки
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Слушаем событие установки
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Показываем нативный промпт установки
    deferredPrompt.prompt();

    // Ждем выбора пользователя
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ Пользователь установил PWA');
    } else {
      console.log('❌ Пользователь отклонил установку');
    }

    // Очищаем промпт
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Не показываем промпт снова в этой сессии
  };

  // Не показываем, если уже установлено или нет промпта
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-30 animate-slideUp">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Download className="h-6 w-6 text-green-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 mb-1">
              Установить приложение
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Быстрый доступ к О.Доставка прямо с главного экрана
            </p>

            {/* Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
              >
                Установить
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

