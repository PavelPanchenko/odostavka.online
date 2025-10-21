import { create } from 'zustand';
import { favoritesAPI } from '@/lib/api';

export interface FavoriteItem {
  id: number;
  name: string;
  price?: number;
  image?: string;
  description?: string;
  brand?: string;
  old_price?: number;
  is_discount?: boolean;
  type?: string;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  isLoading: boolean;
  
  // Действия
  setFavorites: (favorites: FavoriteItem[]) => void;
  addToFavorites: (item: FavoriteItem) => Promise<void>;
  removeFromFavorites: (itemId: number) => Promise<void>;
  clearFavorites: () => void;
  isFavorite: (itemId: number) => boolean;
  setLoading: (loading: boolean) => void;
  loadFavoritesFromServer: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,
      
      setFavorites: (favorites: FavoriteItem[]) => {
        set({ favorites });
      },
      
      addToFavorites: async (item: FavoriteItem) => {
        const { favorites } = get();
        const isAlreadyFavorite = favorites.some(favItem => favItem.id === item.id);
        
        if (!isAlreadyFavorite) {
          // Оптимистичное обновление UI
          set({ favorites: [...favorites, item] });
          
          // Отправляем на сервер через API клиент
          try {
            await favoritesAPI.addToFavorites(item.id);
          } catch (error) {
            // Откатываем при ошибке
            set({ favorites });
            console.error('Error adding favorite:', error);
          }
        }
      },
      
      removeFromFavorites: async (itemId: number) => {
        const { favorites } = get();
        const updatedFavorites = (favorites || []).filter(item => item.id !== itemId);
        
        // Оптимистичное обновление UI
        set({ favorites: updatedFavorites });
        
        // Отправляем на сервер через API клиент
        try {
          await favoritesAPI.removeFromFavorites(itemId);
        } catch (error) {
          // Откатываем при ошибке
          set({ favorites });
          console.error('Error removing favorite:', error);
        }
      },
      
      clearFavorites: () => {
        set({ favorites: [] });
      },
      
      isFavorite: (itemId: number) => {
        const { favorites } = get();
        return favorites.some(item => item.id === itemId);
      },
      
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  loadFavoritesFromServer: async () => {
    try {
      set({ isLoading: true });
      
      // Проверяем наличие токена
      const token = localStorage.getItem('access_token');
      if (!token) {
        // Нет токена - очищаем избранное
        set({ favorites: [], isLoading: false });
        return;
      }
      
      // Загружаем через API клиент
      const products = await favoritesAPI.getFavorites();
      const favorites = (products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        description: product.description,
        brand: product.brand,
        old_price: product.old_price,
        is_discount: product.is_discount,
        type: 'product'
      }));
      
      set({ favorites });
      console.log('✅ Favorites loaded from server:', favorites.length);
    } catch (error) {
      console.error('Error loading favorites:', error);
      // При ошибке очищаем избранное
      set({ favorites: [] });
    } finally {
      set({ isLoading: false });
    }
  },
}));
