/**
 * Хук для управления корзиной с учетом авторизации
 */
import { useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';

export const useCart = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { items, clearCart, addItem, removeItem, updateQuantity, getTotalPrice, getTotalItems, getItemQuantity } = useCartStore();

  // Очищаем корзину при выходе из системы
  useEffect(() => {
    if (!isAuthenticated && items.length > 0) {
      console.log('🧹 Cart: Clearing cart for unauthenticated user');
      clearCart();
    }
  }, [isAuthenticated, items.length, clearCart]);

  // Логируем изменения корзины
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🛒 Cart: User authenticated, cart items:', items.length);
    } else {
      console.log('🛒 Cart: User not authenticated, cart should be empty');
    }
  }, [isAuthenticated, items.length]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getItemQuantity,
    isAuthenticated,
    user
  };
};
