'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Calendar,
  User,
  MapPin,
  Phone,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useOrders, Order } from '@/hooks/useOrders';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import OrderEditModal from '@/components/OrderEditModal';
import { useToast } from '@/hooks/useToast';

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  
  const {
    useOrdersQuery,
    fetchOrder,
    updateOrder,
    updateOrderItems,
    updateOrderStatus,
    exportOrders,
    setError,
  } = useOrders();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = localStorage.getItem('adminNotifyEnabled');
    return v ? v === '1' : true;
  });
  const lastMaxOrderIdRef = useRef<number>(0);

  // Настройки подсветки новых заказов (минуты)
  const NEW_ORDER_THRESHOLD_MIN = 15;

  const formatDateTime = (iso: string) => {
    // Если сервер прислал время без таймзоны (напр. "2025-10-20T12:00:00"),
    // трактуем его как UTC, чтобы избежать сдвига на -3 часа в МСК.
    const hasTZ = /Z|[+-]\d{2}:?\d{2}$/.test(iso);
    const normalized = hasTZ ? iso : `${iso}Z`;
    const d = new Date(normalized);
    return d.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };


  useEffect(() => {
    // no-op: загрузка теперь управляется react-query
  }, [user, search, statusFilter, dateFilter, currentPage]);

  const loadOrdersFilters = () => {
    const filters: any = {
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage
    };

    if (search) filters.search = search;
    if (statusFilter) filters.status = statusFilter;
    if (dateFilter) {
      const date = new Date();
      if (dateFilter === 'today') {
        filters.start_date = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.start_date = weekAgo.toISOString();
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filters.start_date = monthAgo.toISOString();
      }
    }

    return filters;
  };

  const { data: orders = [], isLoading: loadingOrders, error, refetch: refetchOrders } = useOrdersQuery(loadOrdersFilters());

  // Просим разрешение на уведомления при включении
  useEffect(() => {
    if (!notifyEnabled || typeof window === 'undefined') return;
    try {
      if (Notification && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch {}
  }, [notifyEnabled]);

  // Звук (WebAudio) и пуш-уведомление при появлении новых заказов
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    const maxId = Math.max(...orders.map(o => o.id));
    if (lastMaxOrderIdRef.current === 0) {
      lastMaxOrderIdRef.current = maxId;
      return;
    }
    if (maxId > lastMaxOrderIdRef.current) {
      // Обновляем маркер
      const newCount = orders.filter(o => o.id > lastMaxOrderIdRef.current).length;
      lastMaxOrderIdRef.current = maxId;

      if (notifyEnabled) {
        // Звук
        try {
          const ctx = new (window as any).AudioContext();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime);
          g.gain.setValueAtTime(0.0001, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
          o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.4);
        } catch {}

        // Notification
        try {
          if (Notification && Notification.permission === 'granted') {
            const newest = orders.find(o => o.id === maxId);
            const title = `Новый заказ #${maxId}`;
            const body = newCount > 1 ? `+${newCount} новых заказов` : `Сумма: ₽${(newest?.total_amount ?? '').toString()}`;
            const n = new Notification(title, { body });
            n.onclick = () => window.focus();
          }
        } catch {}
      }
    }
  }, [orders, notifyEnabled]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast('Статус заказа обновлен', 'success');
    } catch (error) {
      showToast('Ошибка обновления статуса', 'error');
    }
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const order = await fetchOrder(orderId);
      if (order) {
        setSelectedOrder(order);
        setShowDetailsModal(true);
      }
    } catch (error) {
      showToast('Ошибка загрузки заказа', 'error');
    }
  };

  const handleEditOrder = async (orderId: number) => {
    try {
      const order = await fetchOrder(orderId);
      if (order) {
        setSelectedOrder(order);
        setShowEditModal(true);
      }
    } catch (error) {
      showToast('Ошибка загрузки заказа', 'error');
    }
  };

  const handleSaveOrder = async (orderId: number, updates: Partial<Order>) => {
    try {
      await updateOrder(orderId, updates);
      showToast('Заказ обновлен', 'success');
      setShowEditModal(false);
      setSelectedOrder(null);
    } catch (error) {
      throw error; // Ошибка будет обработана в модальном окне
    }
  };

  const handleSaveOrderItems = async (orderId: number, items: OrderItem[]) => {
    try {
      await updateOrderItems(orderId, items);
      showToast('Товары в заказе обновлены', 'success');
    } catch (error) {
      throw error; // Ошибка будет обработана в модальном окне
    }
  };

  const handleExportOrders = async () => {
    try {
      setExporting(true);
      const filters: any = {};
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;
      if (dateFilter) {
        const date = new Date();
        if (dateFilter === 'today') {
          filters.start_date = new Date(date.setHours(0, 0, 0, 0)).toISOString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          filters.start_date = weekAgo.toISOString();
        } else if (dateFilter === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filters.start_date = monthAgo.toISOString();
        }
      }
      
      await exportOrders(filters);
      showToast('Заказы экспортированы в CSV', 'success');
    } catch (error: any) {
      console.error('Export error:', error);
      showToast(error.message || 'Ошибка экспорта заказов', 'error');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(orders.length / itemsPerPage);

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

  if (loading || loadingOrders) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Заказы</h1>
          <p className="text-gray-600">Управление заказами клиентов</p>
        </div>
        <button
          onClick={handleExportOrders}
          disabled={exporting}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {exporting ? 'Экспорт...' : 'Экспорт'}
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по ID, клиенту..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Все статусы</option>
            <option value="pending">Заказ создан</option>
            <option value="confirmed">Подтвержден</option>
            <option value="preparing">Готовится</option>
            <option value="delivering">В пути</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменен</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Все время</option>
            <option value="today">Сегодня</option>
            <option value="week">За неделю</option>
            <option value="month">За месяц</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            defaultValue=""
          >
            <option value="">Все суммы</option>
            <option value="0-500">До 500₽</option>
            <option value="500-1000">500-1000₽</option>
            <option value="1000-2000">1000-2000₽</option>
            <option value="2000+">Свыше 2000₽</option>
          </select>
          
          <button
            onClick={() => refetchOrders()}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5 mr-2" />
            Применить
          </button>
        </div>
      </div>

      {/* Таблица заказов */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заказ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const createdAt = new Date(order.created_at).getTime();
                const isNew = Date.now() - createdAt < NEW_ORDER_THRESHOLD_MIN * 60 * 1000;
                const rowBg = isNew ? 'bg-green-50' : '';
                return (
                <tr
                  key={order.id}
                  className={`hover:bg-gray-50 ${rowBg}`}
                >
                  <td className={`px-6 py-4 whitespace-nowrap ${rowBg}`}>
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                        <span>#{order.id}</span>
                        {isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Новый
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{order.items_count} товаров</div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${rowBg}`}>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {order.user_name || 'Неизвестный'}
                        </div>
                        <div className="text-sm text-gray-500">ID: {order.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${rowBg}`}>
                    ₽{order.total_amount.toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${rowBg}`}>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">Заказ создан</option>
                      <option value="confirmed">Подтвержден</option>
                      <option value="preparing">Готовится</option>
                      <option value="delivering">В пути</option>
                      <option value="delivered">Доставлен</option>
                      <option value="cancelled">Отменен</option>
                    </select>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${rowBg}`}>
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${rowBg}`}>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Просмотреть детали"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEditOrder(order.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Показано {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, orders.length)} из {orders.length} заказов
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальные окна */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
      />

      <OrderEditModal
        order={selectedOrder}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOrder(null);
        }}
        onSave={handleSaveOrder}
        onSaveItems={handleSaveOrderItems}
      />
    </div>
  );
}
