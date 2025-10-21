'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useUniversalCart } from '@/hooks/useUniversalCart';
import { useRouter } from 'next/navigation';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const router = useRouter();
  const { items, getTotalPrice, getTotalWithDelivery, getTotalItems, removeItem, updateQuantity, clearCart } = useUniversalCart();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Block body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  const totalPrice = getTotalPrice();
  const totalWithDelivery = getTotalWithDelivery();
  const totalItems = getTotalItems();

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const handleClearCart = () => {
    if (confirm('Очистить корзину?')) {
      clearCart();
    }
  };

  if (!isOpen || !isMounted) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Cart Panel */}
      <div className="absolute right-0 top-0 bottom-20 w-full max-w-md bg-gray-50 shadow-2xl transform transition-transform flex flex-col overflow-hidden rounded-b-3xl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Корзина</h2>
                <p className="text-gray-500 text-xs">{totalItems} товаров</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Cart Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Корзина пуста</h3>
                <p className="text-gray-500 mb-4 text-sm">Добавьте товары из каталога</p>
                <button
                  onClick={() => {
                    onClose();
                    router.push('/');
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Начать покупки
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 p-4 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center space-x-3">
                      {/* Item Image */}
                      <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-lg">🛒</div>
                        )}
                      </div>
                      
                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-gray-600 text-xs">
                          {item.price} ₽ за шт.
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-gray-900 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center hover:bg-green-300 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-green-700" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-600">Сумма</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {item.price * item.quantity} ₽
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  {/* Total */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold text-gray-900">Итого</span>
                    <span className="text-lg font-bold text-green-600">{totalWithDelivery} ₽</span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          Оформить заказ
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleClearCart}
                      className="w-full text-red-600 py-2 text-xs hover:text-red-700 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Очистить корзину
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}