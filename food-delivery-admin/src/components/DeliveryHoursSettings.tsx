import { useState, useEffect, memo } from 'react';
import { Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { useDeliveryHours } from '@/hooks/useDeliveryHours';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

interface DeliveryHoursSettingsProps {
  onSave?: (hours: DeliveryHours) => void;
}

interface DeliveryHours {
  is24_7: boolean;
  days: {
    [key: string]: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' }
];

function DeliveryHoursSettings({ onSave }: DeliveryHoursSettingsProps) {
  const { hours, loading, error, updateHours } = useDeliveryHours();
  const { toast, showToast, hideToast } = useToast();
  const [is24_7, setIs24_7] = useState(false);
  const [localHours, setLocalHours] = useState<DeliveryHours | null>(null);

  useEffect(() => {
    if (hours) {
      setLocalHours(hours);
      setIs24_7(hours.is24_7);
    }
  }, [hours]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>Ошибка загрузки рабочих часов: {error}</p>
        </div>
      </div>
    );
  }

  if (!localHours) {
    return null;
  }

  const handle24_7Toggle = async () => {
    const newIs24_7 = !is24_7;
    setIs24_7(newIs24_7);
    
    const updatedHours = {
      ...localHours,
      is24_7: newIs24_7
    };
    
    setLocalHours(updatedHours);
    
    try {
      await updateHours(updatedHours);
      showToast('Настройки сохранены', 'success');
      onSave?.(updatedHours);
    } catch (error) {
      showToast('Ошибка сохранения настроек', 'error');
    }
  };

  const handleDayToggle = async (dayKey: string) => {
    const updatedHours = {
      ...localHours,
      days: {
        ...localHours.days,
        [dayKey]: {
          ...localHours.days[dayKey],
          enabled: !localHours.days[dayKey].enabled
        }
      }
    };
    
    setLocalHours(updatedHours);
    
    try {
      await updateHours(updatedHours);
      showToast('Настройки сохранены', 'success');
      onSave?.(updatedHours);
    } catch (error) {
      showToast('Ошибка сохранения настроек', 'error');
    }
  };

  const handleTimeChange = async (dayKey: string, field: 'start' | 'end', value: string) => {
    const updatedHours = {
      ...localHours,
      days: {
        ...localHours.days,
        [dayKey]: {
          ...localHours.days[dayKey],
          [field]: value
        }
      }
    };
    
    setLocalHours(updatedHours);
    
    try {
      await updateHours(updatedHours);
      showToast('Настройки сохранены', 'success');
      onSave?.(updatedHours);
    } catch (error) {
      showToast('Ошибка сохранения настроек', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <Clock className="h-6 w-6 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Рабочие часы доставки</h3>
      </div>

      {/* Тогл для режима 24/7 */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Режим 24/7</h4>
            <p className="text-sm text-gray-500">Доставка работает круглосуточно</p>
          </div>
          <button
            type="button"
            onClick={handle24_7Toggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              is24_7 ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                is24_7 ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Настройки по дням недели (скрыты в режиме 24/7) */}
      {!is24_7 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.key} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleDayToggle(day.key)}
                  className={`flex-shrink-0 ${
                    localHours.days[day.key].enabled ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {localHours.days[day.key].enabled ? (
                    <ToggleRight className="h-6 w-6" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {day.label}
                  </label>
                  
                  {localHours.days[day.key].enabled ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={localHours.days[day.key].start}
                        onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={localHours.days[day.key].end}
                        onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Выходной</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Информация о режиме 24/7 */}
      {is24_7 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Доставка работает круглосуточно 7 дней в неделю
            </span>
          </div>
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

export default memo(DeliveryHoursSettings);
