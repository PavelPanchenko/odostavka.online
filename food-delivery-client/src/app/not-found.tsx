'use client';

import Link from 'next/link';
import { Home, Search, ShoppingBag, ArrowLeft } from 'lucide-react';

/**
 * Кастомная 404 страница
 */
export default function NotFound() {
  return (
    <div className="h-full bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-green-600 mb-2">404</h1>
          <div className="w-32 h-1 bg-green-600 mx-auto rounded-full"></div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Страница не найдена
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          К сожалению, запрашиваемая страница не существует или была перемещена
        </p>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-left">
            Возможно вы искали:
          </h3>
          
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Каталог товаров</p>
                <p className="text-xs text-gray-500">Выбрать продукты</p>
              </div>
            </Link>

            <Link
              href="/favorites"
              className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Search className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Избранное</p>
                <p className="text-xs text-gray-500">Любимые товары</p>
              </div>
            </Link>

            <Link
              href="/orders"
              className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Мои заказы</p>
                <p className="text-xs text-gray-500">История покупок</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Action Button */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg w-full justify-center"
        >
          <Home className="h-5 w-5" />
          <span>На главную</span>
        </Link>

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mt-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Вернуться назад</span>
        </button>
      </div>
    </div>
  );
}

