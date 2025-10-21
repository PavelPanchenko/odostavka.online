import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useDeliveryAvailability } from '@/hooks/useDeliveryHours';

export default function DeliveryStatus() {
  const { isAvailable, loading, error } = useDeliveryAvailability();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
        <span className="text-sm">Проверка доступности доставки...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-orange-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">Не удалось проверить доступность доставки</span>
      </div>
    );
  }

  if (isAvailable === null) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${
      isAvailable ? 'text-green-600' : 'text-red-600'
    }`}>
      {isAvailable ? (
        <>
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Доставка доступна</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Доставка недоступна</span>
        </>
      )}
    </div>
  );
}

export function DeliveryHoursDisplay() {
  const { hours, loading, error } = useDeliveryHours();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm">Загрузка рабочих часов...</span>
      </div>
    );
  }

  if (error || !hours) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm">Рабочие часы: ежедневно с 9:00 до 22:00</span>
      </div>
    );
  }

  if (hours.is24_7) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Доставка работает 24/7</span>
      </div>
    );
  }

  // Получаем текущий день
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long' }).toLowerCase();
  const dayMapping: { [key: string]: string } = {
    'понедельник': 'monday',
    'вторник': 'tuesday',
    'среда': 'wednesday',
    'четверг': 'thursday',
    'пятница': 'friday',
    'суббота': 'saturday',
    'воскресенье': 'sunday'
  };

  const currentDayKey = dayMapping[today] || 'monday';
  const currentDay = hours.days[currentDayKey as keyof typeof hours.days];

  if (!currentDay.enabled) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm">Сегодня выходной</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-600">
      <Clock className="h-4 w-4" />
      <span className="text-sm">
        Сегодня: {currentDay.start} - {currentDay.end}
      </span>
    </div>
  );
}
