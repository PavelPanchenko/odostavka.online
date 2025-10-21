import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { endpoints } from '@/lib/endpoints';

interface DayWorkingHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface DeliveryHours {
  is24_7: boolean;
  days: {
    monday: DayWorkingHours;
    tuesday: DayWorkingHours;
    wednesday: DayWorkingHours;
    thursday: DayWorkingHours;
    friday: DayWorkingHours;
    saturday: DayWorkingHours;
    sunday: DayWorkingHours;
  };
}

export function useDeliveryHours() {
  const [hours, setHours] = useState<DeliveryHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHours = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(endpoints.delivery.workingHours);
      setHours(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки рабочих часов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHours();
  }, []);

  return {
    hours,
    loading,
    error,
    refetch: fetchHours
  };
}

export function useDeliveryAvailability() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(endpoints.delivery.available);
      // Бэкенд возвращает ключ is_available
      setIsAvailable(Boolean(response.data?.is_available));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка проверки доступности доставки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAvailability();
  }, []);

  return {
    isAvailable,
    loading,
    error,
    refetch: checkAvailability
  };
}
