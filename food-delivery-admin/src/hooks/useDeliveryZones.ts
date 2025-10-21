import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface DeliveryZone {
  id: string;
  name: string;
  cost: number;
  min_order_amount: number;
  free_delivery_threshold?: number;
  delivery_time: string;
  radius?: number;
}

// Глобальное состояние для предотвращения повторных загрузок
let globalHasLoaded = false;
let globalZones: DeliveryZone[] = [];

export function useDeliveryZones() {
  const [zones, setZones] = useState<DeliveryZone[]>(globalZones);
  const [loading, setLoading] = useState(!globalHasLoaded);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/delivery/zones');
      const fetchedZones = response.data.zones || [];
      globalZones = fetchedZones;
      globalHasLoaded = true;
      if (mountedRef.current) {
        setZones(fetchedZones);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Ошибка загрузки зон доставки';
      if (mountedRef.current) {
        setError(errorMsg);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const createZone = useCallback(async (zoneData: Omit<DeliveryZone, 'id'>) => {
    try {
      setError(null);
      const response = await api.post('/admin/delivery/zones', zoneData);
      const newZone = response.data;
      // Обновляем глобальный и локальный стейт
      globalZones = [...globalZones, newZone];
      if (mountedRef.current) {
        setZones(prevZones => [...prevZones, newZone]);
      }
      return newZone;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Ошибка создания зоны';
      if (mountedRef.current) {
        setError(errorMsg);
      }
      throw err;
    }
  }, []);

  const updateZone = useCallback(async (zoneId: string, zoneData: Partial<Omit<DeliveryZone, 'id'>>) => {
    try {
      setError(null);
      const response = await api.put(`/admin/delivery/zones/${zoneId}`, zoneData);
      const updatedZone = response.data;
      // Обновляем глобальный и локальный стейт
      globalZones = globalZones.map(zone => zone.id === zoneId ? updatedZone : zone);
      if (mountedRef.current) {
        setZones(prevZones => prevZones.map(zone => 
          zone.id === zoneId ? updatedZone : zone
        ));
      }
      return updatedZone;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Ошибка обновления зоны';
      if (mountedRef.current) {
        setError(errorMsg);
      }
      throw err;
    }
  }, []);

  const deleteZone = useCallback(async (zoneId: string) => {
    try {
      setError(null);
      const response = await api.delete(`/admin/delivery/zones/${zoneId}`);
      // Обновляем глобальный и локальный стейт
      globalZones = globalZones.filter(zone => zone.id !== zoneId);
      if (mountedRef.current) {
        setZones(prevZones => prevZones.filter(zone => zone.id !== zoneId));
      }
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Ошибка удаления зоны';
      if (mountedRef.current) {
        setError(errorMsg);
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Загружаем зоны только если они еще не загружены глобально
    if (!globalHasLoaded) {
      fetchZones();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchZones]);

  return {
    zones,
    loading,
    error,
    createZone,
    updateZone,
    deleteZone,
    refetch: fetchZones
  };
}
