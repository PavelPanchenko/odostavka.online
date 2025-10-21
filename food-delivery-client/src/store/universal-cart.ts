/**
 * Универсальный store для управления корзиной
 */
import { create } from 'zustand';
import showToast from '@/lib/toast';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export interface DeliveryInfo {
  cost: number;
  isFree: boolean;
  time: string;
  zone?: string;
}

interface UniversalCartStore {
  items: CartItem[];
  deliveryInfo: DeliveryInfo | null;
  maxProductsPerOrder?: number;
  
  // Действия
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryInfo: (delivery: DeliveryInfo | null) => void;
  setMaxProductsLimit: (limit?: number) => void;
  
  // Геттеры
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemQuantity: (itemId: string) => number;
  getTotalWithDelivery: () => number;
}

export const useUniversalCartStore = create<UniversalCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryInfo: null,
      maxProductsPerOrder: undefined,

      addItem: (item) => {
        const { items, maxProductsPerOrder } = get();
        const existingItem = (items || []).find(cartItem => cartItem.id === item.id);
        const totalQty = (items || []).reduce((acc, it) => acc + it.quantity, 0);
        if (typeof maxProductsPerOrder === 'number' && totalQty + 1 > maxProductsPerOrder) {
          showToast.error(`Максимум товаров в заказе: ${maxProductsPerOrder}`);
          return;
        }
        
        if (existingItem) {
          set({
            items: (items || []).map(cartItem =>
              cartItem.id === item.id
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
            )
          });
        } else {
          set({
            items: [...(items || []), { ...item, quantity: 1 }]
          });
        }
      },

      removeItem: (itemId) => {
        const { items } = get();
        set({
          items: (items || []).filter(item => item.id !== itemId)
        });
      },

      updateQuantity: (itemId, quantity) => {
        const { items, maxProductsPerOrder } = get();
        const totalOther = (items || []).filter(i => i.id !== itemId).reduce((acc, it) => acc + it.quantity, 0);
        if (typeof maxProductsPerOrder === 'number' && quantity + totalOther > maxProductsPerOrder) {
          showToast.error(`Нельзя больше ${maxProductsPerOrder} товаров в заказе`);
          return;
        }
        
        if (quantity <= 0) {
          set({
            items: (items || []).filter(item => item.id !== itemId)
          });
        } else {
          set({
            items: (items || []).map(item =>
              item.id === itemId
                ? { ...item, quantity }
                : item
            )
          });
        }
      },

      clearCart: () => {
        set({ items: [], deliveryInfo: null });
      },

      setDeliveryInfo: (delivery) => {
        set({ deliveryInfo: delivery });
      },

      setMaxProductsLimit: (limit) => {
        set({ maxProductsPerOrder: typeof limit === 'number' ? limit : undefined });
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getItemQuantity: (itemId) => {
        const { items } = get();
        const item = items.find(item => item.id === itemId);
        return item ? item.quantity : 0;
      },

      getTotalWithDelivery: () => {
        const { items, deliveryInfo } = get();
        const itemsTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const deliveryCost = deliveryInfo?.isFree ? 0 : (deliveryInfo?.cost || 0);
        return itemsTotal + deliveryCost;
      }
    }),
    {
      name: 'universal-cart-storage',
      // Очищаем корзину при выходе из приложения
      onRehydrateStorage: () => (state) => {
        // Проверяем, авторизован ли пользователь
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (!token) {
            // Если пользователь не авторизован, очищаем корзину
            state?.clearCart();
          }
        }
      },
    }
  )
);