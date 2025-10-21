/**
 * API клиент для О.Доставка
 */
import axios from 'axios';
import { logger } from './logger';
import { API_BASE_URL, endpoints } from './endpoints';
import { buildUrl } from './url';

// В проде не логируем базовый URL (чтобы не зашумлять консоль)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  logger.log('API Base URL:', API_BASE_URL);
}

// Создаем экземпляр axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена авторизации
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Убрали избыточное логирование каждого запроса
    }
  }
  return config;
});

// Флаг для предотвращения циклических refresh запросов
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Интерцептор для обработки ошибок и автоматического обновления токена
api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const error: any = err as any;
    const originalRequest = (error as any)?.config;
    
    // Подавляем не критичные ошибки блоков доставки
    const reqUrl: string = typeof originalRequest?.url === 'string' ? originalRequest.url : '';
    const isDeliveryNoise =
      reqUrl.includes(endpoints.delivery.available) ||
      reqUrl.includes(endpoints.delivery.zones) ||
      reqUrl.includes(endpoints.delivery.settings);

    // Логируем только критичные ошибки (5xx, сеть) и не засоряем консоль 4xx (валидация/403 и т.п.)
    if (typeof window !== 'undefined' && !isDeliveryNoise) {
      const status = (err as any)?.response?.status as number | undefined;
      const isCritical = status === undefined || status >= 500;
      if (isCritical) {
        const details = {
          url: originalRequest?.url || null,
          status: status ?? null,
          message: (err as any)?.message || 'Unknown error',
          data: (err as any)?.response?.data ?? null,
        } as const;
        console.error('API Error Details:', details);
        logger.error('API Error:', details);
      }
    }
    
    // Если 401 и не запрос на refresh
    if ((err as any)?.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      // Не пытаемся рефрешить, если сам запрос был на refresh
      if (originalRequest.url === endpoints.auth.refresh || originalRequest._isRefreshRequest) {
        // Refresh токен тоже невалидный - чистим токены и пробрасываем ошибку без редиректа
        logger.log('Refresh token invalid, clearing tokens (no redirect)');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(err);
      }
      
      if (isRefreshing) {
        // Если уже идет обновление, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        logger.log('No refresh token, clearing tokens (no redirect)');
        localStorage.removeItem('access_token');
        return Promise.reject(err);
      }
      
      try {
        logger.log('Refreshing access token');
        const response = await axios.post(`${API_BASE_URL}${endpoints.auth.refresh}`, {
          refresh_token: refreshToken,
        }, { headers: { 'Content-Type': 'application/json' } });
        
        const { access_token, refresh_token: new_refresh_token } = response.data;
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', new_refresh_token);
        
        // Синхронизируем с zustand store
        if (typeof window !== 'undefined') {
          // Обновляем токены в localStorage
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', new_refresh_token);
        }
        
        logger.log('Token refreshed successfully');
        
        // Обновляем токен в оригинальном запросе
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        logger.log('Token refresh failed, clearing tokens (no redirect)');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(err);
  }
);

// Типы данных
export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  role: string;
  created_at: string;
  telegram_user_id?: string;
}

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  delivery_fee: number;
  minimum_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  preparation_time: number;
  restaurant_id: number;
  category_id: number;
  created_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  restaurant_id: number;
  courier_id?: number;
  status: string;
  total_amount: number;
  delivery_fee: number;
  delivery_address: string;
  delivery_phone: string;
  notes?: string;
  created_at: string;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  name: string;
  phone?: string;
  address?: string;
  telegram_user_id?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserResponse;
}

// Продукты
export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  old_price?: number;
  image_url?: string;
  weight?: string;
  brand?: string;
  barcode?: string;
  is_available: boolean;
  is_discount: boolean;
  stock_quantity: number;
  category_id: number;
  created_at: string;
  updated_at?: string;
  category?: ProductCategory;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at?: string;
  product?: Product;
}

export interface CartResponse {
  items: CartItem[];
  total_items: number;
  total_price: number;
}

// Заказы
export interface OrderItemCreate {
  product_id: number;
  quantity: number;
}

export interface OrderCreate {
  delivery_address: string;
  delivery_phone: string;
  notes?: string;
  items: OrderItemCreate[];
}

export interface OrderItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
  product_image?: string;
}

export interface OrderResponse {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  delivery_address: string;
  delivery_phone: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItemResponse[];
}

// API методы
export const authAPI = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await api.post(endpoints.auth.login, {
      email,
      password,
    });
    return response.data;
  },

  register: async (email: string, password: string, name: string, phone?: string): Promise<{ status: string; email: string; expires_at: string; resend_available_in: number } | TokenResponse> => {
    const response = await api.post(endpoints.auth.register, {
      email,
      password,
      full_name: name,
      phone,
    });
    return response.data;
  },

  // Восстановление пароля
  passwordForgot: async (email: string): Promise<{ status: string }> => {
    const response = await api.post(endpoints.auth.passwordForgot, { email });
    return response.data;
  },

  passwordResend: async (email: string): Promise<{ status: string }> => {
    const response = await api.post(endpoints.auth.passwordResend, { email });
    return response.data;
  },

  passwordReset: async (email: string, code: string, newPassword: string): Promise<{ status: string }> => {
    const response = await api.post(endpoints.auth.passwordReset, { email, code, new_password: newPassword });
    return response.data;
  },

  verifyEmail: async (email: string, code: string): Promise<TokenResponse> => {
    const response = await api.post(endpoints.auth.verifyEmail, { email, code });
    return response.data;
  },

  resendVerification: async (email: string): Promise<{ status: string; expires_at?: string }> => {
    const response = await api.post(endpoints.auth.resendVerification, { email });
    return response.data;
  },

  googleAuth: async (googleData: {
    google_id: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<TokenResponse> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Отправляем данные в Google Auth:', googleData);
      console.log('URL:', endpoints.auth.google);
      console.log('Headers:', api.defaults.headers);
    }
    try {
      const response = await api.post(endpoints.auth.google, googleData);
      if (process.env.NODE_ENV === 'development') console.log('Google Auth успешно:', response.data);
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Ошибка Google Auth:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: error.config
        });
      }
      throw error;
    }
  },

  googleRegister: async (googleData: {
    google_id: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<TokenResponse> => {
    if (process.env.NODE_ENV === 'development') console.log('Отправляем данные в Google Register:', googleData);
    try {
      const response = await api.post(endpoints.auth.googleRegister, googleData);
      if (process.env.NODE_ENV === 'development') console.log('Google Register успешно:', response.data);
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Ошибка Google Register:', error);
      throw error;
    }
  },

  getMe: async (): Promise<User> => {
    const response = await api.get(endpoints.auth.me);
    return response.data;
  },

  updateProfile: async (data: {
    name: string;
    phone?: string;
    address?: string;
  }): Promise<UserResponse> => {
    const response = await api.put(endpoints.auth.me, {
      full_name: data.name,
      phone: data.phone,
      address: data.address,
    });
    return response.data;
  },

  registerTelegram: async (chat_id: string): Promise<{ status: string }> => {
    const response = await api.post('/api/v1/users/me/telegram', { chat_id });
    return response.data;
  },
};

export const restaurantsAPI = {
  getRestaurants: async (): Promise<Restaurant[]> => {
    const response = await api.get(endpoints.restaurants.root);
    return response.data;
  },

  getRestaurant: async (id: number): Promise<Restaurant> => {
    const response = await api.get(endpoints.restaurants.byId(id));
    return response.data;
  },

  getMenu: async (restaurantId: number): Promise<MenuItem[]> => {
    const response = await api.get(endpoints.restaurants.menu(restaurantId));
    return response.data;
  },
};

export const ordersAPI = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get(endpoints.orders.root);
    return response.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await api.get(endpoints.orders.byId(id));
    return response.data;
  },

  createOrder: async (orderData: OrderCreate): Promise<OrderResponse> => {
    const response = await api.post(`${endpoints.orders.root}/`, orderData);
    return response.data;
  },

  getUserOrders: async (): Promise<OrderResponse[]> => {
    const response = await api.get(`${endpoints.orders.root}/`);
    return response.data;
  },

  getOrderById: async (id: number): Promise<OrderResponse> => {
    const response = await api.get(endpoints.orders.byId(id));
    return response.data;
  },
};

export const productsAPI = {
  getCategories: async (): Promise<ProductCategory[]> => {
    const response = await api.get(endpoints.products.categories);
    return Array.isArray(response.data) ? response.data : [];
  },

  getProducts: async (params?: {
    skip?: number;
    limit?: number;
    category_id?: number;
    search?: string;
  }): Promise<Product[]> => {
    const response = await api.get(endpoints.products.root, { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(endpoints.products.byId(id));
    return response.data;
  },

  getCart: async (): Promise<CartResponse> => {
    const response = await api.get(endpoints.products.cart);
    return response.data;
  },

  addToCart: async (productId: number, quantity: number): Promise<CartItem> => {
    const response = await api.post(endpoints.products.cart, {
      product_id: productId,
      quantity
    });
    return response.data;
  },

  updateCartItem: async (itemId: number, quantity: number): Promise<CartItem> => {
    const response = await api.put(endpoints.products.cartItem(itemId), { quantity });
    return response.data;
  },

  removeFromCart: async (itemId: number): Promise<void> => {
    await api.delete(endpoints.products.cartItem(itemId));
  },

  clearCart: async (): Promise<void> => {
    await api.delete(endpoints.products.cart);
  },
};

export const favoritesAPI = {
  getFavorites: async (): Promise<Product[]> => {
    const response = await api.get(endpoints.favorites.root);
    return response.data;
  },

  addToFavorites: async (productId: number): Promise<{ message: string }> => {
    const response = await api.post(endpoints.favorites.root, {
      product_id: productId
    });
    return response.data;
  },

  removeFromFavorites: async (productId: number): Promise<{ message: string }> => {
    const response = await api.delete(endpoints.favorites.remove(productId));
    return response.data;
  },

  checkFavorite: async (productId: number): Promise<{ is_favorite: boolean }> => {
    const response = await api.get(endpoints.favorites.check(productId));
    return response.data;
  },
};

// Типы для платежей
export interface PaymentCreate {
  order_id: number;
  amount: number;
  description?: string;
}

export interface PaymentResponse {
  id: number;
  order_id: number;
  yookassa_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method_type?: string;
  paid_at?: string;
  description?: string;
  confirmation_url?: string;
  is_test: boolean;
  created_at: string;
  updated_at?: string;
}

export const paymentsAPI = {
  createPayment: async (paymentData: PaymentCreate): Promise<PaymentResponse> => {
    const response = await api.post(endpoints.payments.create, paymentData);
    return response.data;
  },

  getPayment: async (paymentId: number): Promise<PaymentResponse> => {
    const response = await api.get(endpoints.payments.byId(paymentId));
    return response.data;
  },

  getOrderPayments: async (orderId: number): Promise<PaymentResponse[]> => {
    const response = await api.get(endpoints.payments.order(orderId));
    return response.data;
  },
};

// Типы для доставки
export interface DeliverySettings {
  id: number;
  base_delivery_cost: number;
  free_delivery_threshold: number;
  delivery_zones?: Record<string, any>;
  delivery_time_min: number;
  delivery_time_max: number;
  is_delivery_available: boolean;
  delivery_working_hours?: Record<string, string>;
  created_at: string;
  updated_at?: string;
}

export interface DeliveryCostCalculation {
  order_amount: number;
  delivery_zone?: string;
  delivery_cost: number;
  is_free_delivery: boolean;
  delivery_time: string;
  free_delivery_threshold?: number;
}

export interface DeliveryAvailability {
  is_available: boolean;
  zones: Record<string, any>;
}

export const deliveryAPI = {
  getSettings: async (): Promise<DeliverySettings> => {
    const response = await api.get(endpoints.delivery.settings);
    return response.data;
  },

  calculateCost: async (orderAmount: number, deliveryZone?: string): Promise<DeliveryCostCalculation> => {
    const url = buildUrl(endpoints.delivery.calculate, {
      order_amount: orderAmount,
      delivery_zone: deliveryZone,
    });
    const response = await api.get(url);
    return response.data;
  },

  checkAvailability: async (): Promise<DeliveryAvailability> => {
    const response = await api.get(endpoints.delivery.available);
    return response.data;
  },

  getZones: async (): Promise<{ zones: Record<string, any> }> => {
    const response = await api.get(endpoints.delivery.zones);
    return response.data;
  },
};

// Типы для поддержки и контактной информации
export interface SupportSettings {
  id: number;
  telegram_username: string;
  telegram_link: string;
  support_phone?: string;
  support_email?: string;
  working_hours?: string;
  company_name?: string;
  company_address?: string;
  privacy_email?: string;
  is_active: boolean;
  description?: string;
}

export const supportAPI = {
  getSettings: async (): Promise<SupportSettings> => {
    const response = await api.get(endpoints.support.settings);
    return response.data;
  },
};

export default api;
