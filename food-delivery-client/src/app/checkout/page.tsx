'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, MessageSquare, ShoppingBag, Check, Wallet, CreditCard, Navigation } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useUniversalCart } from '@/hooks/useUniversalCart';
import { ordersAPI } from '@/lib/api';
import { logger } from '@/lib/logger';
import DeliveryInfo from '@/components/DeliveryInfo';
import showToast from '@/lib/toast';
import { useDeliveryAvailability } from '@/hooks/useDeliveryHours';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { items, getTotalPrice, getTotalWithDelivery, clearCart } = useUniversalCart();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [gettingLocation, setGettingLocation] = useState(false);
  const { isAvailable, loading: availLoading } = useDeliveryAvailability();
  
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Авто-скрытие баннера ошибки и показ через тост
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (isMounted && isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isMounted, isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isMounted && items.length === 0) {
      router.push('/cart');
    }
  }, [isMounted, items, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        address: user.address || '',
        phone: user.phone || '',
        notes: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`;
      logger.log('Запрашиваем адрес:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      logger.log('Получен ответ:', data);
      
      if (data.display_name) {
        logger.log('Адрес установлен:', data.display_name);
        setFormData(prev => ({
          ...prev,
          address: data.display_name
        }));
        setGettingLocation(false);
      } else {
        throw new Error('Адрес не найден');
      }
    } catch (err) {
      logger.error('Ошибка геокодирования:', err);
      // Используем тестовые координаты (центр Москвы)
      logger.log('Используем тестовый адрес для разработки');
      setFormData(prev => ({
        ...prev,
        address: 'Москва, Красная площадь, 1'
      }));
      setGettingLocation(false);
    }
  };

  const handleGetLocation = () => {
    logger.log('Кнопка геолокации нажата');
    
    if (!navigator.geolocation) {
      logger.error('Геолокация не поддерживается');
      setError('Геолокация не поддерживается вашим браузером');
      return;
    }

    logger.log('Геолокация поддерживается, запрашиваем координаты');
    setGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        logger.log('Координаты получены:', { latitude, longitude });
        await getAddressFromCoords(latitude, longitude);
      },
      async (error) => {
        logger.error('Ошибка геолокации:', error.code, error.message);
        
        // Для разработки используем координаты Москвы
        if (error.code === error.POSITION_UNAVAILABLE || error.code === 2) {
          logger.log('Местоположение недоступно, используем координаты Москвы для теста');
          await getAddressFromCoords(55.7558, 37.6173); // Красная площадь
          return;
        }
        
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Доступ к геолокации запрещен. Разрешите доступ в настройках браузера');
            break;
          case error.TIMEOUT:
            setError('Превышено время ожидания определения местоположения');
            break;
          default:
            setError('Не удалось определить местоположение. Введите адрес вручную');
        }
      },
      {
        enableHighAccuracy: false, // Изменено на false для лучшей совместимости
        timeout: 15000,
        maximumAge: 300000 // Разрешаем использовать кеш до 5 минут
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (availLoading || isAvailable === false) {
      const msg = 'Доставка сейчас недоступна';
      setError(msg);
      showToast.error(msg);
      return;
    }
    
    if (!formData.address.trim()) {
      const msg = 'Укажите адрес доставки';
      setError(msg);
      showToast.error(msg);
      return;
    }
    
    if (!formData.phone.trim()) {
      const msg = 'Укажите номер телефона';
      setError(msg);
      showToast.error(msg);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const orderData = {
        delivery_address: formData.address,
        delivery_phone: formData.phone,
        notes: formData.notes || undefined,
        items: items.map(item => {
          // Извлекаем числовой ID из формата "product_123"
          const productId = parseInt(item.id.replace('product_', ''));
          return {
            product_id: productId,
            quantity: item.quantity,
          };
        }),
      };

      logger.log('Creating order:', orderData);
      const order = await ordersAPI.createOrder(orderData);
      logger.log('Order created:', order);
      
      // Сохраняем ID нового заказа для показа бейджа
      if (typeof window !== 'undefined') {
        const existingNewOrders = localStorage.getItem('newOrders');
        const newOrders = existingNewOrders ? JSON.parse(existingNewOrders) : [];
        newOrders.push({
          orderId: order.id,
          timestamp: Date.now()
        });
        localStorage.setItem('newOrders', JSON.stringify(newOrders));
        logger.log('New order saved:', order.id);
      }
      
      // Очищаем корзину и перенаправляем на страницу заказов
      clearCart();
      router.push('/orders');
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        const status = err?.response?.status as number | undefined;
        const data = err?.response?.data;
        const isNetworkError = !err?.response; // нет ответа сервера
        const hasUseful = (typeof status === 'number' && status >= 500) || isNetworkError || (data && (data.detail || Object.keys(data).length > 0));
        if (hasUseful) {
          logger.error('Order creation failed:', data?.detail || err?.message || `status ${status}`);
        }
      }
      const msg = err?.response?.data?.detail || 'Ошибка создания заказа. Попробуйте снова.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted || !isHydrated) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  const totalPrice = getTotalPrice();
  const totalWithDelivery = getTotalWithDelivery();
  const submitDisabled = loading || availLoading || isAvailable === false;

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Оформление заказа</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error is shown as top sticky banner */}

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <ShoppingBag className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Ваш заказ</h2>
            </div>
            
            <div className="space-y-2 mb-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    {(item.price * item.quantity).toFixed(2)} ₽
                  </span>
                </div>
              ))}
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Итого:</span>
                <span className="text-xl font-bold text-green-600">
                  {totalWithDelivery.toFixed(2)} ₽
                </span>
              </div>
              {totalWithDelivery !== totalPrice && (
                <div className="text-right text-sm text-gray-500 mt-1">
                  товары: {totalPrice.toFixed(2)} ₽ + доставка: {(totalWithDelivery - totalPrice).toFixed(2)} ₽
                </div>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <DeliveryInfo 
            orderAmount={totalPrice}
            address={formData.address}
            className="mb-3"
          />

          {/* Payment Method */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Wallet className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Способ оплаты</h2>
            </div>

            <div className="space-y-3">
              {/* Оплата наличными */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`w-full flex items-center space-x-3 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}>
                  {paymentMethod === 'cash' && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-gray-700" />
                    <p className="font-medium text-gray-900">Наличными при получении</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Оплата курьеру при доставке
                  </p>
                </div>
              </button>

              {/* Оплата картой (временно недоступно) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                disabled
                className="w-full flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300"></div>
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-gray-700" />
                    <p className="font-medium text-gray-900">Онлайн оплата</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Временно недоступно
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
            <h2 className="font-semibold text-gray-900">Информация о доставке</h2>
            
            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Адрес доставки
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 p-1 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  title="Определить мое местоположение"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Navigation className={`h-5 w-5 text-green-600 ${gettingLocation ? 'animate-spin' : ''}`} />
                </button>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Город, улица, дом, квартира"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер телефона
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+7 (999) 123-45-67"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий к заказу (необязательно)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Например: позвоните за 10 минут"
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitDisabled}
            className={`w-full text-white py-4 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
              submitDisabled ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? (
              <span>Оформление...</span>
            ) : (
              <>
                <Check className="h-5 w-5" />
                <span>{submitDisabled ? 'Доставка недоступна' : `Оформить заказ на ${totalPrice.toFixed(2)} ₽`}</span>
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-center text-xs text-gray-500">
            Нажимая кнопку, вы подтверждаете заказ и соглашаетесь с условиями доставки
          </p>
        </form>
        </div>
      </div>
    </div>
  );
}
