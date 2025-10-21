'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Truck, 
  Save, 
  RefreshCw, 
  DollarSign
} from 'lucide-react';
import { deliverySettingsAPI, DeliverySettings, DeliverySettingsUpdate } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import DeliveryZonesSettings from '@/components/DeliveryZonesSettings';
import DeliveryHoursSettings from '@/components/DeliveryHoursSettings';

export default function DeliverySettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);

  // React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeliverySettingsUpdate>({
    defaultValues: {
      base_delivery_cost: 150,
      free_delivery_threshold: 2000,
      delivery_time_min: 30,
      delivery_time_max: 60,
      is_delivery_available: true,
      delivery_zones: {},
      delivery_working_hours: {
        monday: '9:00-22:00',
        tuesday: '9:00-22:00',
        wednesday: '9:00-22:00',
        thursday: '9:00-22:00',
        friday: '9:00-22:00',
        saturday: '9:00-22:00',
        sunday: '9:00-22:00'
      }
    }
  });

  // Дополнительные настройки доставки
  const [additionalSettings, setAdditionalSettings] = useState({
    max_products_per_order: 50,
    delivery_radius: 10
  });


  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await deliverySettingsAPI.getSettings();
      setSettings(data);
      reset({
        base_delivery_cost: data.base_delivery_cost,
        free_delivery_threshold: data.free_delivery_threshold,
        delivery_time_min: data.delivery_time_min,
        delivery_time_max: data.delivery_time_max,
        is_delivery_available: data.is_delivery_available,
        delivery_zones: data.delivery_zones || {},
        delivery_working_hours: data.delivery_working_hours || {
          monday: '9:00-22:00',
          tuesday: '9:00-22:00',
          wednesday: '9:00-22:00',
          thursday: '9:00-22:00',
          friday: '9:00-22:00',
          saturday: '9:00-22:00',
          sunday: '9:00-22:00'
        }
      });
      setAdditionalSettings(prev => ({
        ...prev,
        max_products_per_order: (data as any).max_products_per_order ?? prev.max_products_per_order
      }));
    } catch (error) {
      console.error('Ошибка загрузки настроек доставки:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: DeliverySettingsUpdate) => {
    try {
      setSaving(true);
      const payload: DeliverySettingsUpdate = {
        ...data,
        max_products_per_order: additionalSettings.max_products_per_order
      };
      // Зоны управляются отдельным разделом — не перезаписываем их пустым объектом из формы
      delete (payload as any).delivery_zones;
      if (settings) await deliverySettingsAPI.updateSettings(payload);
      else await deliverySettingsAPI.createSettings(payload);
      await fetchSettings();
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Truck className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Настройки доставки</h1>
            <p className="text-gray-600">Управление стоимостью и условиями доставки</p>
          </div>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Сохранить
        </button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Основные настройки */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <DollarSign className="h-6 w-6 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Основные настройки</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Базовая стоимость доставки (₽)
            </label>
            <input
              type="number"
              {...register('base_delivery_cost', { 
                valueAsNumber: true,
                min: { value: 0, message: 'Значение не может быть отрицательным' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="150"
              step="0.01"
            />
            {errors.base_delivery_cost && (
              <p className="text-xs text-red-600 mt-1">{errors.base_delivery_cost.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Сумма для бесплатной доставки (₽)
            </label>
            <input
              type="number"
              {...register('free_delivery_threshold', { 
                valueAsNumber: true,
                min: { value: 0, message: 'Значение не может быть отрицательным' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="2000"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Укажите 0 для отключения бесплатной доставки
            </p>
            {errors.free_delivery_threshold && (
              <p className="text-xs text-red-600 mt-1">{errors.free_delivery_threshold.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Минимальное время доставки (мин)
            </label>
            <input
              type="number"
              {...register('delivery_time_min', { 
                valueAsNumber: true,
                min: { value: 1, message: 'Минимум 1 минута' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="30"
            />
            {errors.delivery_time_min && (
              <p className="text-xs text-red-600 mt-1">{errors.delivery_time_min.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Максимальное время доставки (мин)
            </label>
            <input
              type="number"
              {...register('delivery_time_max', { 
                valueAsNumber: true,
                min: { value: 1, message: 'Минимум 1 минута' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="60"
            />
            {errors.delivery_time_max && (
              <p className="text-xs text-red-600 mt-1">{errors.delivery_time_max.message}</p>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_delivery_available')}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Доставка доступна
            </span>
          </label>
        </div>
      </div>

      {/* Дополнительные настройки доставки */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <DollarSign className="h-6 w-6 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Дополнительные настройки</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Максимум товаров в заказе
            </label>
            <input
              type="number"
              value={additionalSettings.max_products_per_order || ''}
              onChange={(e) => setAdditionalSettings({...additionalSettings, max_products_per_order: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="50"
              min="1"
              max="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Радиус доставки (км)
            </label>
            <input
              type="number"
              value={additionalSettings.delivery_radius || ''}
              onChange={(e) => setAdditionalSettings({...additionalSettings, delivery_radius: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="10"
              min="1"
              max="50"
            />
          </div>
        </div>
      </div>
      </form>

      {/* Зоны доставки - ВНЕ формы */}
      <DeliveryZonesSettings />

      {/* Рабочие часы - ВНЕ формы */}
      <DeliveryHoursSettings />

      {/* Диалог подтверждения */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
