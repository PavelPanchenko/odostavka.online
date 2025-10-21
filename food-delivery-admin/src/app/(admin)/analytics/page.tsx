'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '@/lib/api';

interface DashboardStats {
  users: {
    total: number;
    active: number;
  };
  products: {
    total: number;
    available: number;
  };
  orders: {
    total: number;
    last_30_days: number;
  };
  revenue: {
    total: number;
    last_30_days: number;
  };
  order_statuses: Array<{
    status: string;
    count: number;
  }>;
}

interface TimelineData {
  date: string;
  orders_count: number;
  revenue: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loadingData, setLoadingData] = useState(true);


  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoadingData(true);
      const [statsResponse, timelineResponse] = await Promise.all([
        api.get('/admin/stats/dashboard'),
        api.get('/admin/stats/orders-timeline?days=30')
      ]);
      
      setStats(statsResponse.data);
      setTimelineData(timelineResponse.data);
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoadingData(false);
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

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
        <p className="text-gray-600">Статистика и аналитика системы</p>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.users.total || 0}</p>
              <p className="text-sm text-gray-500">Активных: {stats?.users.active || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего продуктов</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.products.total || 0}</p>
              <p className="text-sm text-gray-500">Доступных: {stats?.products.available || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего заказов</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.orders.total || 0}</p>
              <p className="text-sm text-gray-500">За 30 дней: {stats?.orders.last_30_days || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Общий доход</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₽{(stats?.revenue.total || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                За 30 дней: ₽{(stats?.revenue.last_30_days || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График заказов по дням */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Заказы за последние 30 дней</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                  formatter={(value, name) => [value, name === 'orders_count' ? 'Заказы' : 'Доход (₽)']}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders_count" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="orders_count"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* График доходов по дням */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Доходы за последние 30 дней</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                  formatter={(value) => [`₽${Number(value).toLocaleString()}`, 'Доход']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Статусы заказов */}
      {stats?.order_statuses && stats.order_statuses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение заказов по статусам</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.order_statuses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="status" 
                  tickFormatter={(value) => getStatusText(value)}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, 'Количество']}
                  labelFormatter={(value) => getStatusText(value)}
                />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
