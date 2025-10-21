'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Индикатор отсутствия подключения к интернету
 */
export default function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
          <div className="bg-red-500 text-white py-2 px-4 shadow-lg animate-slideDown">
            <div className="flex items-center justify-center space-x-2">
              <WifiOff className="h-4 w-4 animate-pulse" />
              <span className="font-medium text-xs">
                Нет подключения к интернету
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Online Banner (восстановление) */}
      {isOnline && wasOffline && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
          <div className="bg-green-500 text-white py-2 px-4 shadow-lg animate-slideDown">
            <div className="flex items-center justify-center space-x-2">
              <Wifi className="h-4 w-4" />
              <span className="font-medium text-xs">
                Подключение восстановлено
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Offline Page Overlay */}
      {!isOnline && (
        <div className="fixed inset-0 z-40 bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
                <WifiOff className="h-12 w-12 text-red-500" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Нет подключения к интернету
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              Проверьте подключение к Wi-Fi или мобильным данным и попробуйте снова
            </p>

            {/* Tips */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Что можно сделать:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Проверьте настройки Wi-Fi</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Включите мобильные данные</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Проверьте режим "В самолете"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Перезагрузите роутер</span>
                </li>
              </ul>
            </div>

            {/* Retry Button */}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg"
            >
              Попробовать снова
            </button>

            {/* Status */}
            <div className="mt-4 text-sm text-gray-500">
              Ожидание подключения...
            </div>
          </div>
        </div>
      )}
    </>
  );
}

