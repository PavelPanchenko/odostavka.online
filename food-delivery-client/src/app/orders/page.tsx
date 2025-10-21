'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, CreditCard, Wallet, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useSession } from 'next-auth/react';
import { ordersAPI, OrderResponse, paymentsAPI } from '@/lib/api';
import showToast from '@/lib/toast';
import { logger } from '@/lib/logger';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const { status } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<number[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [isMounted, status, router]);

  // Загружаем новые заказы из localStorage
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      const newOrdersData = localStorage.getItem('newOrders');
      if (newOrdersData) {
        try {
          const data = JSON.parse(newOrdersData);
          // Фильтруем заказы не старше 5 минут (300000 миллисекунд)
          const now = Date.now();
          const recentOrders = (Array.isArray(data) ? data : []).filter((order: any) => now - order.timestamp < 300000);
          setNewOrderIds(recentOrders.map((order: any) => order.orderId));
          
          // Обновляем localStorage с отфильтрованными заказами
          if (recentOrders.length !== data.length) {
            localStorage.setItem('newOrders', JSON.stringify(recentOrders));
          }
        } catch (e) {
          console.error('Error loading new orders:', e);
        }
      }
    }
  }, [isMounted]);

  useEffect(() => {
    if (isMounted && isHydrated && isAuthenticated) {
      loadOrders();
    }
  }, [isMounted, isHydrated, isAuthenticated]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getUserOrders();
      setOrders(data);
    } catch (err: any) {
      setError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'delivering':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
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

  const handlePayment = async (order: OrderResponse) => {
    try {
      setPaymentLoading(order.id);
      console.log('💳 Creating payment for order:', order.id);
      
      const payment = await paymentsAPI.createPayment({
        order_id: order.id,
        amount: order.total_amount,
        description: `Оплата заказа #${order.id}`
      });
      
      logger.log('Payment created:', payment);
      
      // Перенаправляем на страницу оплаты ЮKassa
      if (payment.confirmation_url) {
        window.location.href = payment.confirmation_url;
      } else {
        showToast.error('Ошибка: не получен URL оплаты');
      }
    } catch (err: any) {
      logger.error('Payment error:', err);
      showToast.error('Ошибка создания платежа. Попробуйте снова.');
    } finally {
      setPaymentLoading(null);
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

  if (status !== 'authenticated') {
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
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Мои заказы</h1>
            </div>
            {orders.length > 0 && (
              <span className="ml-auto text-sm text-gray-500">
                {orders.length} {orders.length === 1 ? 'заказ' : 'заказов'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-16 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button
              onClick={loadOrders}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Нет заказов</h2>
            <p className="text-gray-500 mb-6">
              Вы еще не сделали ни одного заказа
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              Перейти к каталогу
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                {/* NEW Badge */}
                {newOrderIds.includes(order.id) && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    НОВЫЙ
                  </div>
                )}
                
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className="font-semibold text-gray-900">
                      Заказ #{order.id}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>

                {/* Items Preview */}
                <div className="space-y-2 mb-3">
                  {order.items.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} шт. × {item.price.toFixed(2)} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-gray-500 pl-15">
                      и еще {order.items.length - 2} товар(ов)
                    </p>
                  )}
                </div>

                  {/* Footer */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {order.total_amount.toFixed(2)} ₽
                    </span>
                  </div>
                  
                  {/* Индикатор оплаты наличными */}
                  {order.status === 'pending' && (
                    <div className="mt-3 flex items-center justify-center space-x-2 text-sm text-gray-600 bg-gray-50 py-2 rounded-lg">
                      <Wallet className="h-4 w-4" />
                      <span>Оплата наличными при получении</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
