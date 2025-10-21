/**
 * Хук для управления универсальной корзиной с учетом авторизации
 */
import { useEffect } from 'react';
import { useUniversalCartStore } from '@/store/universal-cart';
import { useAuthStore } from '@/store/auth';

export const useUniversalCart = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { 
    items, 
    deliveryInfo,
    maxProductsPerOrder,
    addItem, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    setDeliveryInfo,
    setMaxProductsLimit,
    getTotalPrice, 
    getTotalItems, 
    getItemQuantity,
    getTotalWithDelivery 
  } = useUniversalCartStore();

  // Очищаем корзину при выходе из системы
  useEffect(() => {
    if (!isAuthenticated && items.length > 0) {
      console.log('🧹 Universal Cart: Clearing cart for unauthenticated user');
      clearCart();
    }
  }, [isAuthenticated, items.length, clearCart]);

  // Логируем изменения корзины
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🛒 Universal Cart: User authenticated, cart items:', items.length);
    } else {
      console.log('🛒 Universal Cart: User not authenticated, cart should be empty');
    }
  }, [isAuthenticated, items.length]);

  return {
    items,
    deliveryInfo,
    maxProductsPerOrder,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setDeliveryInfo,
    setMaxProductsLimit,
    getTotalPrice,
    getTotalItems,
    getItemQuantity,
    getTotalWithDelivery,
    isAuthenticated,
    user
  };
};
