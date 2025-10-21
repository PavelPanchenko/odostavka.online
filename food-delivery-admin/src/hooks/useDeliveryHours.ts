import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

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
  const hasLoadedRef = useRef(false);

  const fetchHours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/delivery/working-hours');
      
      if (response.data && (response.data.is24_7 !== undefined || response.data.days)) {
        setHours(response.data);
      } else {
        // Устанавливаем значения по умолчанию
        setHours({
          is24_7: false,
          days: {
            monday: { enabled: true, start: '09:00', end: '22:00' },
            tuesday: { enabled: true, start: '09:00', end: '22:00' },
            wednesday: { enabled: true, start: '09:00', end: '22:00' },
            thursday: { enabled: true, start: '09:00', end: '22:00' },
            friday: { enabled: true, start: '09:00', end: '22:00' },
            saturday: { enabled: true, start: '09:00', end: '22:00' },
            sunday: { enabled: true, start: '09:00', end: '22:00' }
          }
        });
      }
      hasLoadedRef.current = true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки рабочих часов');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateHours = useCallback(async (newHours: DeliveryHours) => {
    try {
      setError(null);
      const response = await api.put('/delivery/working-hours', newHours);
      
      setHours(newHours);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сохранения рабочих часов');
      throw err;
    }
  }, []);

  useEffect(() => {
    // Загружаем часы только один раз при первом монтировании
    if (!hasLoadedRef.current) {
      fetchHours();
    }
  }, [fetchHours]);

  return {
    hours,
    loading,
    error,
    updateHours,
    refetch: fetchHours
  };
}
