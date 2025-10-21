'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, ArrowRight } from 'lucide-react';
import { useUniversalCart } from '@/hooks/useUniversalCart';
import { useRouter } from 'next/navigation';

export default function FloatingCart() {
  const router = useRouter();
  const { items, getTotalPrice, getTotalWithDelivery, getTotalItems, removeItem, clearCart, updateQuantity } = useUniversalCart();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const totalWithDelivery = getTotalWithDelivery();

  // Показываем корзину только если в ней есть товары
  useEffect(() => {
    setIsMounted(true);
    setIsVisible(totalItems > 0);
  }, [totalItems]);

  // Отслеживаем скролл
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      setIsScrolling(true);
      
      // Очищаем предыдущий таймаут
      clearTimeout(timeoutId);
      
      // Устанавливаем новый таймаут
      timeoutId = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleCheckout = () => {
    setIsExpanded(false);
    router.push('/checkout');
  };

  const handleClearCart = () => {
    if (confirm('Очистить корзину?')) {
      clearCart();
      setIsExpanded(false);
    }
  };

  // Не показываем если нет товаров или компонент не смонтирован
  if (!isMounted || !isVisible || totalItems === 0) return null;

  return (
    <div className={`fixed bottom-20 right-4 z-40 transition-all duration-500 ${
      isScrolling ? 'translate-y-0 opacity-60' : 'translate-y-4 opacity-30'
    }`}>
      {/* Компактная корзина */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-green-500 text-white p-3 rounded-full shadow-md hover:bg-green-600 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {isMounted && totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </div>
          <div className="text-left">
            <div className="font-semibold">{totalWithDelivery.toFixed(0)} ₽</div>
            <div className="text-xs text-green-100">{totalItems} товаров</div>
          </div>
        </button>
      )}

      {/* Развернутая корзина */}
      {isExpanded && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-72 max-h-80 overflow-hidden">
          {/* Заголовок */}
          <div className="bg-green-500 text-white p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-5 w-5" />
                <div>
                  <h3 className="font-bold">Корзина</h3>
                  <p className="text-green-100 text-sm">{totalItems} товаров</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-green-700 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Список товаров */}
          <div className="max-h-48 overflow-y-auto p-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 bg-gray-50 rounded-xl p-3">
                {/* Изображение товара */}
                <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-lg">🛒</div>
                  )}
                </div>
                
                {/* Информация о товаре */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-gray-600 text-xs">
                    {item.price} ₽
                  </p>
                </div>

                {/* Управление количеством */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-semibold text-gray-900 text-sm min-w-[1.5rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Итого и действия */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-900">Итого:</span>
              <span className="text-xl font-bold text-green-600">
                {totalWithDelivery.toFixed(0)} ₽
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                className="w-full bg-green-500 text-white py-2 px-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Оформить заказ</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleClearCart}
                className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
              >
                Очистить корзину
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
