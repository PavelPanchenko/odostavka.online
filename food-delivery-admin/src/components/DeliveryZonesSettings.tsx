import { useState, useCallback, memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import Toast from '@/components/Toast';

interface DeliveryZone {
  id: string;
  name: string;
  cost: number;
  min_order_amount: number;
  free_delivery_threshold?: number;
  delivery_time: string;
  radius?: number;
}

interface DeliveryZoneFormData {
  name: string;
  cost: number;
  min_order_amount: number;
  free_delivery_threshold: number;
  delivery_time: string;
  radius: number;
}

interface DeliveryZonesSettingsProps {
  onSave?: (zones: DeliveryZone[]) => void;
}

function DeliveryZonesSettings({ onSave }: DeliveryZonesSettingsProps) {
  const { toast, showToast, hideToast } = useToast();
  const { zones, loading, error, createZone, updateZone, deleteZone, refetch } = useDeliveryZones();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  
  // Форма для добавления
  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, formState: { errors: errorsAdd } } = useForm<DeliveryZoneFormData>({
    defaultValues: {
      name: '',
      cost: 0,
      min_order_amount: 0,
      free_delivery_threshold: 0,
      delivery_time: '30-60 мин',
      radius: 5
    }
  });

  // Форма для редактирования
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm<DeliveryZoneFormData>();

  // Обновляем форму редактирования при выборе зоны
  useEffect(() => {
    if (editingZone) {
      resetEdit({
        name: editingZone.name,
        cost: editingZone.cost,
        min_order_amount: editingZone.min_order_amount,
        free_delivery_threshold: editingZone.free_delivery_threshold || 0,
        delivery_time: editingZone.delivery_time,
        radius: editingZone.radius || 5
      });
    }
  }, [editingZone, resetEdit]);

  const onSubmitAdd = useCallback(async (data: DeliveryZoneFormData) => {
    try {
      await createZone(data);
      resetAdd();
      setShowAddForm(false);
      showToast('Зона добавлена', 'success');
    } catch (error) {
      showToast('Ошибка при добавлении зоны', 'error');
    }
  }, [createZone, resetAdd, showToast]);

  const onSubmitEdit = useCallback(async (data: DeliveryZoneFormData) => {
    if (!editingZone) return;

    try {
      // Проверяем, изменились ли данные
      const hasChanges = 
        data.name !== editingZone.name ||
        data.cost !== editingZone.cost ||
        data.min_order_amount !== editingZone.min_order_amount ||
        data.free_delivery_threshold !== (editingZone.free_delivery_threshold || 0) ||
        data.delivery_time !== editingZone.delivery_time ||
        data.radius !== (editingZone.radius || 5);

      if (!hasChanges) {
        setEditingZone(null);
        showToast('Нет изменений для сохранения', 'info');
        return;
      }

      await updateZone(editingZone.id, data);
      setEditingZone(null);
      showToast('Зона обновлена', 'success');
    } catch (error) {
      showToast('Ошибка при обновлении зоны', 'error');
    }
  }, [editingZone, updateZone, showToast]);

  const handleEditZone = useCallback((zone: DeliveryZone) => {
    setEditingZone(zone);
  }, []);

  const handleDeleteZone = useCallback(async (zoneId: string) => {
    try {
      await deleteZone(zoneId);
      showToast('Зона удалена', 'success');
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  }, [deleteZone, showToast]);

  // Показываем загрузку только при первой загрузке (когда нет зон)
  if (loading && zones.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error && zones.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>Ошибка загрузки зон доставки: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MapPin className="h-6 w-6 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Зоны доставки</h3>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить зону
        </button>
      </div>

      {/* Форма добавления новой зоны */}
      {showAddForm && (
        <form onSubmit={handleSubmitAdd(onSubmitAdd)} className="mb-6 p-5 border-l-4 border-green-500 rounded-lg bg-green-50 shadow">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Добавить новую зону</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Название зоны
              </label>
              <input
                {...registerAdd('name', { 
                  required: 'Введите название зоны',
                  minLength: { value: 2, message: 'Минимум 2 символа' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ольгинка"
              />
              {errorsAdd.name && <p className="text-xs text-red-600 mt-1">{errorsAdd.name.message}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Стоимость доставки (₽)
              </label>
              <input
                type="number"
                {...registerAdd('cost', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Не может быть отрицательной' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="250"
                step="0.01"
              />
              {errorsAdd.cost && <p className="text-xs text-red-600 mt-1">{errorsAdd.cost.message}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Минимальная сумма заказа (₽)
              </label>
              <input
                type="number"
                {...registerAdd('min_order_amount', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Не может быть отрицательной' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="1700"
                step="0.01"
              />
              {errorsAdd.min_order_amount && <p className="text-xs text-red-600 mt-1">{errorsAdd.min_order_amount.message}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Сумма для бесплатной доставки (₽)
              </label>
              <input
                type="number"
                {...registerAdd('free_delivery_threshold', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Не может быть отрицательной' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="2000"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Укажите 0 для отключения бесплатной доставки в зоне
              </p>
            </div>
            
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Время доставки
              </label>
              <input
                {...registerAdd('delivery_time', { 
                  required: 'Укажите время доставки' 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="30-60 мин"
              />
              {errorsAdd.delivery_time && <p className="text-xs text-red-600 mt-1">{errorsAdd.delivery_time.message}</p>}
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              + Добавить
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                resetAdd();
              }}
              className="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Форма редактирования зоны */}
      {editingZone && (
        <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="mb-6 p-5 border-l-4 border-blue-500 rounded-lg bg-blue-50 shadow">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            Редактировать зону: <span className="text-blue-600 ml-2">{editingZone.name}</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Название зоны
              </label>
              <input
                {...registerEdit('name', { 
                  required: 'Введите название зоны',
                  minLength: { value: 2, message: 'Минимум 2 символа' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ольгинка"
              />
              {errorsEdit.name && <p className="text-xs text-red-600 mt-1">{errorsEdit.name.message}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Стоимость доставки (₽)
              </label>
              <input
                type="number"
                {...registerEdit('cost', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Не может быть отрицательной' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="250"
                step="0.01"
              />
              {errorsEdit.cost && <p className="text-xs text-red-600 mt-1">{errorsEdit.cost.message}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Минимальная сумма заказа (₽)
              </label>
              <input
                type="number"
                {...registerEdit('min_order_amount', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Не может быть отрицательной' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1700"
                step="0.01"
              />
              {errorsEdit.min_order_amount && <p className="text-xs text-red-600 mt-1">{errorsEdit.min_order_amount.message}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Сумма для бесплатной доставки (₽)
              </label>
              <input
                type="number"
                {...registerEdit('free_delivery_threshold', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Не может быть отрицательной' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2000"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Укажите 0 для отключения бесплатной доставки в зоне
              </p>
            </div>
            
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Время доставки
              </label>
              <input
                {...registerEdit('delivery_time', { 
                  required: 'Укажите время доставки' 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="30-60 мин"
              />
              {errorsEdit.delivery_time && <p className="text-xs text-red-600 mt-1">{errorsEdit.delivery_time.message}</p>}
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setEditingZone(null)}
              className="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Список зон */}
      <div className="space-y-4">
        {zones.map((zone, index) => (
          <div key={zone.id || `zone-${index}`} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <h4 className="font-medium text-gray-900">{zone.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Стоимость: {zone.cost}₽</span>
                    <span>Мин. заказ: {zone.min_order_amount}₽</span>
                    <span>Бесплатная доставка: {zone.free_delivery_threshold ? `${zone.free_delivery_threshold}₽` : 'отключена'}</span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {zone.delivery_time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEditZone(zone)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteZone(zone.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Зоны доставки не настроены</p>
        </div>
      )}
      
      {/* Toast уведомления */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

export default memo(DeliveryZonesSettings);
