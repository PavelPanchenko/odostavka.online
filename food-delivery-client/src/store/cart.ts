/**
 * Store для управления корзиной
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  
  // Действия
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Геттеры
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemQuantity: (itemId: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const existingItem = (items || []).find(cartItem => cartItem.id === item.id);
        
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
        const { items } = get();
        
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
        set({
          items: []
        });
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
      }
    }),
    {
      name: 'cart-storage',
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