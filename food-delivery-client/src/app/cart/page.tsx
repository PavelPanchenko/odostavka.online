'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useUniversalCart } from '@/hooks/useUniversalCart';
import DeliveryInfo from '@/components/DeliveryInfo';
import showToast from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function CartPage() {
  const router = useRouter();
  const { items, getTotalPrice, getTotalWithDelivery, getTotalItems, updateQuantity, clearCart } = useUniversalCart();
  const [isMounted, setIsMounted] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const totalPrice = getTotalPrice();
  const totalWithDelivery = getTotalWithDelivery();
  const totalItems = getTotalItems();

  // Предотвращаем hydration mismatch
  if (!isMounted) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  const handleClearCart = () => {
    clearCart();
    showToast.success('Корзина очищена');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Корзина</h1>
              <p className="text-gray-500 text-xs">{totalItems} товаров</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Корзина пуста</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Добавьте товары из каталога
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
            >
              Перейти в каталог
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Items List */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-md mx-auto px-4 py-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start space-x-3">
                  {/* Item Image */}
                  <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="text-2xl">🛒</div>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3">
                      {item.price} ₽ × {item.quantity}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                        >
                          <Plus className="h-4 w-4 text-green-700" />
                        </button>
                      </div>

                      {/* Total Price */}
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          {item.price * item.quantity} ₽
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 flex-shrink-0">
            <div className="max-w-md mx-auto px-4 py-3">
              {/* Delivery Info */}
              <DeliveryInfo 
                orderAmount={totalPrice} 
                className="mb-3"
              />
              
              {/* Total */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-semibold text-gray-900">Итого</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">{totalWithDelivery} ₽</div>
                  {totalWithDelivery !== totalPrice && (
                    <div className="text-xs text-gray-500">
                      товары: {totalPrice} ₽ + доставка: {totalWithDelivery - totalPrice} ₽
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Оформить заказ
                </button>
                
                <button
                  onClick={() => setShowClearModal(true)}
                  className="w-full text-red-600 py-2 text-sm hover:text-red-700 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Очистить корзину
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearCart}
        title="Очистить корзину?"
        message="Все товары будут удалены из корзины. Это действие нельзя отменить."
        confirmText="Да, очистить"
        cancelText="Отмена"
        type="danger"
      />
    </div>
  );
}

