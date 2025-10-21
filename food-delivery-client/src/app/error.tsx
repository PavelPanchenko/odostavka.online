'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Логируем ошибку
    console.error('Application Error:', error);
    
    // TODO: Отправить в Sentry
    // Sentry.captureException(error);
  }, [error]);

  return (
    <div className="h-full bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Что-то пошло не так
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-2">
          Произошла ошибка при загрузке страницы
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="my-4 p-4 bg-red-50 rounded-lg text-left">
            <p className="text-xs font-mono text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col space-y-3 mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Попробовать снова</span>
          </button>

          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center space-x-2 bg-white text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Home className="h-5 w-5" />
            <span>На главную</span>
          </button>
        </div>

        {/* Error ID for support */}
        {error.digest && (
          <p className="mt-6 text-xs text-gray-500">
            ID ошибки: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

