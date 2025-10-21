'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus,
  Store,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { api } from '@/lib/api';
import { buildUrl } from '@/lib/url';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  delivery_fee: number;
  minimum_order: number;
  owner_id: number;
  created_at: string;
  updated_at: string | null;
}

export default function RestaurantsPage() {
  const { user, loading } = useAuth();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);


  useEffect(() => {
    if (user) {
      fetchRestaurants();
    }
  }, [user, search, statusFilter]);

  const fetchRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      const response = await api.get(buildUrl('/admin/restaurants', {
        search,
        is_active: statusFilter,
      }));
      setRestaurants(response.data);
    } catch (error) {
      console.error('Ошибка загрузки ресторанов:', error);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const handleToggleStatus = async (restaurantId: number, currentStatus: boolean) => {
    try {
      await api.put(`/admin/restaurants/${restaurantId}`, {
        is_active: !currentStatus
      });
      setRestaurants(restaurants.map(r => 
        r.id === restaurantId ? { ...r, is_active: !currentStatus } : r
      ));
    } catch (error) {
      console.error('Ошибка обновления ресторана:', error);
    }
  };

  const handleDeleteRestaurant = (restaurantId: number, restaurantName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Удалить ресторан?',
      message: `Вы уверены, что хотите удалить ресторан "${restaurantName}"?\n\nЭто действие нельзя отменить.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await api.delete(`/admin/restaurants/${restaurantId}`);
          setRestaurants(restaurants.filter(r => r.id !== restaurantId));
        } catch (error) {
          console.error('Ошибка удаления ресторана:', error);
        }
      }
    });
  };

  if (loading || loadingRestaurants) {
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
          <h1 className="text-3xl font-bold text-gray-900">Рестораны</h1>
          <p className="text-gray-600">Управление ресторанами и заведениями</p>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Добавить ресторан
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск ресторанов..."
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
            <option value="true">Активные</option>
            <option value="false">Неактивные</option>
          </select>
          
          <button
            onClick={fetchRestaurants}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5 mr-2" />
            Применить
          </button>
        </div>
      </div>

      {/* Сетка ресторанов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Store className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                  <p className="text-sm text-gray-500">ID: {restaurant.id}</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                restaurant.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {restaurant.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            
            {restaurant.description && (
              <p className="text-sm text-gray-600 mb-4">{restaurant.description}</p>
            )}
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {restaurant.address}
              </div>
              {restaurant.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {restaurant.phone}
                </div>
              )}
              {restaurant.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {restaurant.email}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              <span>Минимум: ₽{restaurant.minimum_order}</span>
              <span>Доставка: ₽{restaurant.delivery_fee}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleToggleStatus(restaurant.id, restaurant.is_active)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  restaurant.is_active 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {restaurant.is_active ? 'Деактивировать' : 'Активировать'}
              </button>
              
              <button
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Редактировать"
              >
                <Edit className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handleDeleteRestaurant(restaurant.id, restaurant.name)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Диалог подтверждения */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          confirmText="Удалить"
          cancelText="Отмена"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
