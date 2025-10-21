'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, MapPin, Phone, CreditCard, Wallet, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useSession } from 'next-auth/react';
import { ordersAPI, OrderResponse, supportAPI, SupportSettings } from '@/lib/api';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { isAuthenticated, isHydrated } = useAuthStore();
  const { status } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supportSettings, setSupportSettings] = useState<SupportSettings | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [isMounted, status, router]);

  useEffect(() => {
    if (isMounted && status === 'authenticated' && orderId) {
      loadOrder();
    }
  }, [isMounted, status, orderId]);

  useEffect(() => {
    const loadSupportSettings = async () => {
      try {
        const settings = await supportAPI.getSettings();
        setSupportSettings(settings);
      } catch (error) {
        console.error('Ошибка загрузки настроек поддержки:', error);
        // Используем значения по умолчанию при ошибке
        setSupportSettings({
          id: 0,
          telegram_username: 'your_support_bot',
          telegram_link: 'https://t.me/your_support_bot',
          is_active: true
        });
      }
    };

    if (isMounted) {
      loadSupportSettings();
    }
  }, [isMounted]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getOrderById(Number(orderId));
      setOrder(data);
    } catch (err: any) {
      setError('Не удалось загрузить заказ');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'delivering':
        return <Truck className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Package className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает подтверждения';
      case 'confirmed':
        return 'Подтвержден';
      case 'preparing':
        return 'Готовится';
      case 'delivering':
        return 'Доставляется';
      case 'delivered':
        return 'Доставлен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivering':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSupportClick = () => {
    if (!supportSettings) return;
    
    const telegramUsername = supportSettings.telegram_username;
    
    // Для мобильных устройств откроется приложение, для десктопа — веб-версия
    window.location.href = `tg://resolve?domain=${telegramUsername}`;
    
    // Fallback на веб-версию, если приложение не открылось (через 1.5 секунды)
    setTimeout(() => {
      window.open(supportSettings.telegram_link, '_blank');
    }, 1500);
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

  if (!isAuthenticated) {
    return null;
  }

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
            <div>
              <h1 className="text-xl font-bold text-gray-900">Заказ #{orderId}</h1>
              {order && (
                <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-32 bg-gray-200 rounded mb-3"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <XCircle className="h-20 w-20 text-red-300 mx-auto mb-4" />
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button
              onClick={loadOrder}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : !order ? (
          <div className="text-center py-12">
            <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Заказ не найден</h2>
            <button
              onClick={() => router.push('/orders')}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              Вернуться к заказам
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h2 className="font-bold text-gray-900">Статус заказа</h2>
                    <p className="text-sm text-gray-500">Обновлено только что</p>
                  </div>
                </div>
              </div>
              
              <div className={`px-4 py-3 rounded-xl text-center border-2 ${getStatusColor(order.status)}`}>
                <p className="font-semibold text-lg">{getStatusText(order.status)}</p>
              </div>

              {/* Timeline */}
              <div className="mt-6 space-y-3">
                <div className={`flex items-center space-x-3 ${order.status !== 'pending' ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status !== 'pending' ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">Заказ создан</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${['confirmed', 'preparing', 'delivering', 'delivered'].includes(order.status) ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['confirmed', 'preparing', 'delivering', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">Подтвержден</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${['preparing', 'delivering', 'delivered'].includes(order.status) ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['preparing', 'delivering', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">Готовится</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${['delivering', 'delivered'].includes(order.status) ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['delivering', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">В пути</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${order.status === 'delivered' ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">Доставлен</span>
                </div>
              </div>
            </div>

            {/* Items Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-4">Состав заказа</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} шт. × {item.price.toFixed(2)} ₽
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {(item.quantity * item.price).toFixed(2)} ₽
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-bold text-gray-900">Итого:</span>
                  <span className="font-bold text-green-600">{order.total_amount.toFixed(2)} ₽</span>
                </div>
              </div>
            </div>

            {/* Delivery Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-4">Информация о доставке</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Адрес доставки</p>
                    <p className="font-medium text-gray-900">{order.delivery_address}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p className="font-medium text-gray-900">{order.delivery_phone}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="flex items-start space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Комментарий</p>
                      <p className="font-medium text-gray-900">{order.notes}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3 pt-3 border-t border-gray-100">
                  <Wallet className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Способ оплаты</p>
                    <p className="font-medium text-gray-900">Наличными при получении</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Button */}
            <button
              onClick={handleSupportClick}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Связаться с поддержкой
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

