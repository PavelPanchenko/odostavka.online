'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Package } from 'lucide-react';
import { Order, OrderItem } from '@/hooks/useOrders';
import OrderItemsEditor from './OrderItemsEditor';

interface OrderEditModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: number, updates: Partial<Order>) => Promise<void>;
  onSaveItems?: (orderId: number, items: OrderItem[]) => Promise<void>;
}

export default function OrderEditModal({ order, isOpen, onClose, onSave, onSaveItems }: OrderEditModalProps) {
  const [formData, setFormData] = useState({
    status: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'items'>('details');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (order && isOpen) {
      setFormData({
        status: order.status,
        notes: order.notes || ''
      });
      setOrderItems(order.items || []);
      setError(null);
    }
  }, [order, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      setLoading(true);
      setError(null);
      
      await onSave(order.id, {
        status: formData.status,
        notes: formData.notes || null
      });
      
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сохранения заказа');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItems = async (items: OrderItem[]) => {
    if (!order || !onSaveItems) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await onSaveItems(order.id, items);
      setOrderItems(items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сохранения товаров');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStatusOptions = () => [
    { value: 'pending', label: 'Заказ создан' },
    { value: 'confirmed', label: 'Подтвержден' },
    { value: 'preparing', label: 'Готовится' },
    { value: 'delivering', label: 'В пути' },
    { value: 'delivered', label: 'Доставлен' },
    { value: 'cancelled', label: 'Отменен' }
  ];

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Редактировать заказ #{order.id}</h2>
            <p className="text-gray-600">Внесите изменения в заказ</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Вкладки */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Основная информация
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'items'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Товары в заказе
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Ошибка */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-6">

          {/* Основная информация о заказе */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о заказе</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Клиент:</p>
                <p className="text-sm text-gray-900">{order.user_name || 'Неизвестно'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Сумма:</p>
                <p className="text-sm text-gray-900">₽{order.total_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Адрес:</p>
                <p className="text-sm text-gray-900">{order.delivery_address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Телефон:</p>
                <p className="text-sm text-gray-900">{order.delivery_phone}</p>
              </div>
            </div>
          </div>

          {/* Статус заказа */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Статус заказа
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              {getStatusOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Примечания */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Примечания
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Добавьте примечания к заказу..."
            />
          </div>

              {/* Кнопки */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          ) : (
            <OrderItemsEditor
              orderId={order.id}
              items={orderItems}
              onSave={handleSaveItems}
              onCancel={onClose}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
