'use client';

import { useState, useEffect } from 'react';
import { Truck, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { deliveryAPI, DeliveryCostCalculation, DeliveryAvailability } from '@/lib/api';
import { useUniversalCart } from '@/hooks/useUniversalCart';
import { matchAddressToZone } from '@/lib/zoneMatching';
import { useDeliveryHours } from '@/hooks/useDeliveryHours';

interface DeliveryInfoProps {
  orderAmount: number;
  deliveryZone?: string;
  address?: string;
  className?: string;
}

interface DeliveryData extends DeliveryCostCalculation {
  is_available: boolean;
  zones: Record<string, any>;
}

export default function DeliveryInfo({ orderAmount, deliveryZone, address, className = '' }: DeliveryInfoProps) {
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { setDeliveryInfo, setMaxProductsLimit } = useUniversalCart();
  const { hours } = useDeliveryHours();

  useEffect(() => {
    fetchDeliveryInfo();
  }, [orderAmount, deliveryZone, address]);

  const fetchDeliveryInfo = async () => {
    setLoading(true);
    setError('');
    try {
      // Сначала пробуем получить доступность и зоны, но не падаем при ошибке
      let availabilityData: { is_available: boolean; zones: Record<string, any> } = { is_available: true, zones: {} };
      try {
        availabilityData = await deliveryAPI.checkAvailability();
      } catch (e) {
        console.warn('Availability fetch failed, continue with defaults', e);
      }

      // Если зоны пустые (или недоступны), пробуем загрузить их напрямую
      if (!availabilityData.zones || Object.keys(availabilityData.zones).length === 0) {
        try {
          const zonesResp = await deliveryAPI.getZones();
          availabilityData = { ...availabilityData, zones: zonesResp.zones || {} };
        } catch (e) {
          console.warn('Zones fetch failed, continue without zones', e);
        }
      }

      // Вычисляем зону: переданная явно имеет приоритет, иначе — по адресу и зонам
      const computedZone = deliveryZone || matchAddressToZone(address, availabilityData.zones) || undefined;

      // Получаем расчет стоимости с учетом вычисленной зоны (основной критичный запрос)
      const costData = await deliveryAPI.calculateCost(orderAmount, computedZone);

      const deliveryInfo = {
        ...costData,
        is_available: availabilityData.is_available,
        zones: availabilityData.zones
      };

      setDeliveryData(deliveryInfo);

      // Обновляем store с информацией о доставке
      setDeliveryInfo({
        cost: costData.delivery_cost,
        isFree: costData.is_free_delivery,
        time: costData.delivery_time,
        zone: costData.delivery_zone || computedZone
      });

      // Устанавливаем лимит товаров при наличии в настройках
      try {
        const settings = await deliveryAPI.getSettings();
        setMaxProductsLimit((settings as any).max_products_per_order);
      } catch {}
    } catch (err) {
      setError('Не удалось загрузить информацию о доставке');
      console.error('Delivery info error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !deliveryData) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!deliveryData.is_available) {
    // Рассчитываем ближайшее время открытия по расписанию
    const computeNextOpen = () => {
      if (!hours) return null;
      if (hours.is24_7) return { label: 'круглосуточно', time: '' } as const;

      const dayOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const;
      const ruDays = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

      const now = new Date();
      const todayIdx = now.getDay(); // 0..6 (Sun..Sat)

      const getMinutes = (t: string) => {
        const [hh, mm] = t.split(':').map(Number);
        return hh * 60 + (mm || 0);
      };

      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      for (let offset = 0; offset < 7; offset++) {
        const idx = (todayIdx + offset) % 7;
        const key = dayOrder[idx];
        const day = (hours.days as any)[key];
        if (!day || !day.enabled) continue;

        const startMins = getMinutes(day.start);
        if (offset === 0) {
          // Сегодня: если еще не началась доставка — открытие сегодня
          if (nowMinutes < startMins) {
            return { label: offset === 0 ? 'Сегодня' : ruDays[idx], time: day.start } as const;
          }
        } else {
          return { label: offset === 1 ? 'Завтра' : ruDays[idx], time: day.start } as const;
        }
      }
      return null;
    };

    const next = computeNextOpen();
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <Truck className="h-4 w-4" />
          <span className="text-sm">
            Доставка временно недоступна.
            {next && (
              <>
                <br />
                Ближайшее время работы: {next.label}
                {next.time ? ` с ${next.time}` : ''}
              </>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl ${className}`}>
      {/* Компактная основная информация */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Доставка</span>
            <Clock className="h-3 w-3 text-gray-400 ml-1" />
            <span className="text-xs text-gray-500">{deliveryData.delivery_time}</span>
          </div>
          <div className="flex items-center gap-2">
            {deliveryData.is_free_delivery ? (
              <span className="text-green-600 font-semibold text-sm">Бесплатно</span>
            ) : (
              <span className="text-gray-900 font-semibold text-sm">
                {deliveryData.delivery_cost} ₽
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Информация о бесплатной доставке - компактная */}
        {!deliveryData.is_free_delivery && deliveryData.free_delivery_threshold && deliveryData.free_delivery_threshold > 0 && (
          <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2">
            <p className="text-green-800 text-xs">
              Закажите еще на <span className="font-semibold">
                {Math.ceil(deliveryData.free_delivery_threshold - orderAmount)} ₽
              </span> и получите бесплатную доставку!
            </p>
          </div>
        )}
      </div>

      {/* Развернутая информация */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {/* Зона доставки */}
          {deliveryZone && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Зона: {deliveryZone}</span>
            </div>
          )}

          {/* Зоны доставки */}
          {Object.keys(deliveryData.zones).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Доступные зоны:</p>
              <div className="space-y-1">
                {Object.entries(deliveryData.zones).map(([zone, data]: [string, any]) => (
                  <div key={zone} className="flex justify-between text-xs text-gray-600">
                    <span>{data.name || zone}</span>
                    <span>{data.cost} ₽</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
