'use client';

import { useState, useEffect } from 'react';
import { X, User, MapPin, Phone, Calendar, Package, DollarSign } from 'lucide-react';
import { Order, OrderItem } from '@/hooks/useOrders';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      setOrderDetails(order);
    }
  }, [order, isOpen]);

  if (!isOpen || !orderDetails) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'delivering': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Заказ создан';
      case 'confirmed': return 'Подтвержден';
      case 'preparing': return 'Готовится';
      case 'delivering': return 'В пути';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Заказ #{orderDetails.id}</h2>
            <p className="text-gray-600">
              Создан {new Date(orderDetails.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Статус и основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о заказе</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-24">Статус:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(orderDetails.status)}`}>
                      {getStatusText(orderDetails.status)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Сумма:</span>
                    <span className="ml-2 text-lg font-bold text-gray-900">
                      ₽{orderDetails.total_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Товаров:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {orderDetails.items?.length || orderDetails.items_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о клиенте</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Имя:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {orderDetails.user_name || 'Неизвестно'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500">ID:</span>
                    <span className="ml-2 text-sm text-gray-900">{orderDetails.user_id}</span>
                  </div>
                  {orderDetails.user_email && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500">Email:</span>
                      <span className="ml-2 text-sm text-gray-900">{orderDetails.user_email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Адрес доставки */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Адрес доставки</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">{orderDetails.delivery_address}</p>
                  <div className="flex items-center mt-2">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{orderDetails.delivery_phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Товары в заказе */}
          {orderDetails.items && orderDetails.items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Товары в заказе</h3>
              <div className="space-y-3">
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-12 w-12 object-cover rounded-lg mr-4"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                        <p className="text-sm text-gray-500">Количество: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₽{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">₽{item.price.toLocaleString()} за шт.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Примечания */}
          {orderDetails.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Примечания</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">{orderDetails.notes}</p>
              </div>
            </div>
          )}

          {/* Временные метки */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Временные метки</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Создан:</p>
                  <p className="text-sm text-gray-900">
                    {new Date(orderDetails.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
              {orderDetails.updated_at && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Обновлен:</p>
                    <p className="text-sm text-gray-900">
                      {new Date(orderDetails.updated_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
