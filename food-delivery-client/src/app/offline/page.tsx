'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="h-full bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
            <WifiOff className="h-12 w-12 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Вы сейчас офлайн
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Эта страница доступна без подключения к интернету благодаря PWA технологии
        </p>

        {/* Retry Button */}
        <button
          onClick={handleRefresh}
          className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Попробовать снова</span>
        </button>
      </div>
    </div>
  );
}

