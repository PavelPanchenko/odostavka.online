'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Всего пользователей',
      value: stats?.users.total || 0,
      subtitle: `Активных: ${stats?.users.active || 0}`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Всего продуктов',
      value: stats?.products.total || 0,
      subtitle: `Доступных: ${stats?.products.available || 0}`,
      icon: Package,
      color: 'bg-green-500',
    },
    {
      title: 'Всего заказов',
      value: stats?.orders.total || 0,
      subtitle: `За 30 дней: ${stats?.orders.last_30_days || 0}`,
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
    {
      title: 'Общий доход',
      value: `₽${(stats?.revenue.total || 0).toLocaleString()}`,
      subtitle: `За 30 дней: ₽${(stats?.revenue.last_30_days || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-600">Обзор системы доставки</p>
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Статусы заказов */}
      {stats?.order_statuses && stats.order_statuses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Статусы заказов</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.order_statuses.map((status, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {status.status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Быстрые действия */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Управление пользователями</div>
              <div className="text-sm text-gray-600">Просмотр и редактирование пользователей</div>
            </div>
          </a>
          
          <a
            href="/products"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Управление продуктами</div>
              <div className="text-sm text-gray-600">Добавление и редактирование продуктов</div>
            </div>
          </a>
          
          <a
            href="/orders"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Управление заказами</div>
              <div className="text-sm text-gray-600">Просмотр и обработка заказов</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}