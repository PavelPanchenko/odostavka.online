import axios from 'axios';
import { API_BASE_URL, API_PREFIX, endpoints } from './endpoints';

export const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен из localStorage при каждом запросе
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      // Не редиректим, если мы уже на странице логина
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Типы для настроек доставки
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
  created_by?: number;
  max_products_per_order?: number;
}

export interface DeliverySettingsUpdate {
  base_delivery_cost?: number;
  free_delivery_threshold?: number;
  delivery_zones?: Record<string, any>;
  delivery_time_min?: number;
  delivery_time_max?: number;
  is_delivery_available?: boolean;
  delivery_working_hours?: Record<string, string>;
  max_products_per_order?: number;
}

// API для настроек доставки
export const deliverySettingsAPI = {
  getSettings: async (): Promise<DeliverySettings> => {
    try {
      const response = await api.get(endpoints.admin.delivery.settings);
      return response.data;
    } catch (error: any) {
      console.error('Ошибка получения настроек доставки:', error);
      throw new Error(error.response?.data?.detail || 'Ошибка загрузки настроек доставки');
    }
  },

  updateSettings: async (settings: DeliverySettingsUpdate): Promise<DeliverySettings> => {
    try {
      const response = await api.put(endpoints.admin.delivery.settings, settings);
      return response.data;
    } catch (error: any) {
      console.error('Ошибка обновления настроек доставки:', error);
      throw new Error(error.response?.data?.detail || 'Ошибка сохранения настроек доставки');
    }
  },

  createSettings: async (settings: DeliverySettingsUpdate): Promise<DeliverySettings> => {
    try {
      const response = await api.post(endpoints.admin.delivery.settings, settings);
      return response.data;
    } catch (error: any) {
      console.error('Ошибка создания настроек доставки:', error);
      throw new Error(error.response?.data?.detail || 'Ошибка создания настроек доставки');
    }
  },

  calculateCost: async (orderAmount: number, deliveryZone?: string) => {
    const response = await api.get(endpoints.delivery.calculate, {
      params: { order_amount: orderAmount, delivery_zone: deliveryZone }
    });
    return response.data;
  },

  checkAvailability: async () => {
    const response = await api.get(endpoints.delivery.available);
    return response.data;
  }
};

// Типы и API для контактных/компаний настроек (support settings)
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

export type SupportSettingsCreate = Omit<SupportSettings, 'id' | 'is_active'> & { is_active?: boolean };
export type SupportSettingsUpdate = Partial<Omit<SupportSettings, 'id'>>;

export const supportSettingsAPI = {
  getActive: async (): Promise<SupportSettings> => {
    const response = await api.get(endpoints.admin.support.settings);
    return response.data;
  },
  create: async (payload: SupportSettingsCreate): Promise<SupportSettings> => {
    const response = await api.post(endpoints.admin.support.settings, payload);
    return response.data;
  },
  update: async (id: number, payload: SupportSettingsUpdate): Promise<SupportSettings> => {
    const response = await api.put(endpoints.admin.support.byId(id), payload);
    return response.data;
  },
};
