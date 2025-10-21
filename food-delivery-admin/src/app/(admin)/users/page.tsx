'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  UserPlus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Input from '@/components/Input';
import Select from '@/components/Select';
import SearchInput from '@/components/SearchInput';
import { useFilteredUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { getErrorMessage, logError } from '@/lib/errorHandler';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  restaurants_count?: number;
  has_restaurants?: boolean;
}

interface UserFormData {
  email: string;
  username: string;
  full_name: string;
  phone: string;
  address: string;
  role: string;
  is_active: boolean;
  password?: string;
}

export default function UsersPage() {
  const { user, loading } = useAuth();
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // React Query hooks с клиентской фильтрацией
  const { data: users = [], isLoading: loadingUsers } = useFilteredUsers({ 
    search, // Без debounce - фильтрация мгновенная
    role: roleFilter, 
    is_active: statusFilter 
  });
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      email: '',
      username: '',
      full_name: '',
      phone: '',
      address: '',
      role: 'customer',
      is_active: true,
      password: ''
    }
  });

  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);


  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleOpenCreateModal = () => {
    reset({
      email: '',
      username: '',
      full_name: '',
      phone: '',
      address: '',
      role: 'customer',
      is_active: true,
      password: ''
    });
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    reset({
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role,
      is_active: user.is_active,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const onSubmitUser = async (data: UserFormData) => {
    try {
      // Подготавливаем данные, заменяя пустые строки на null
      const dataToSend: any = {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        role: data.role,
        is_active: data.is_active,
      };

      if (showCreateModal) {
        // Создание - пароль обязателен
        dataToSend.password = data.password;
        await createUserMutation.mutateAsync(dataToSend);
        showToast('Пользователь успешно создан', 'success');
      } else if (selectedUser) {
        // Обновление - пароль опционален
        if (data.password && data.password.trim()) {
          dataToSend.password = data.password;
        }
        await updateUserMutation.mutateAsync({ id: selectedUser.id, data: dataToSend });
        showToast('Пользователь успешно обновлен', 'success');
      }

      handleCloseModals();
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
    }
  };

  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    updateUserMutation.mutate({ 
      id: userId, 
      data: { is_active: !currentStatus } 
    }, {
      onSuccess: () => {
        showToast(
          `Пользователь ${!currentStatus ? 'активирован' : 'деактивирован'}`,
          'success'
        );
      },
      onError: (error: any) => {
        const errorMessage = getErrorMessage(error, 'Ошибка обновления статуса');
        showToast(errorMessage, 'error');
      }
    });
  };

  const handleDeleteUser = (userId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Удалить пользователя?',
      message: 'Вы уверены, что хотите ПОЛНОСТЬЮ УДАЛИТЬ этого пользователя из базы данных?\n\nЭто действие необратимо! Будут также удалены все связанные данные (заказы, корзина, избранное).',
      type: 'danger',
      onConfirm: () => {
        setConfirmDialog(null);
        deleteUserMutation.mutate(userId, {
          onSuccess: () => {
            showToast('Пользователь успешно удален из базы данных', 'success');
          },
          onError: (error: any) => {
            const errorMessage = getErrorMessage(error, 'Ошибка удаления пользователя');
            showToast(errorMessage, 'error');
          }
        });
      }
    });
  };

  if (loading || loadingUsers) {
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
      {/* Toast уведомления */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-4">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-gray-600">Управление пользователями системы</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Добавить пользователя
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск пользователей..."
          />
          
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'Все роли' },
              { value: 'customer', label: 'Клиент' },
              { value: 'restaurant_owner', label: 'Владелец ресторана' },
              { value: 'courier', label: 'Курьер' },
              { value: 'admin', label: 'Администратор' }
            ]}
          />
          
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Все статусы' },
              { value: 'true', label: 'Активные' },
              { value: 'false', label: 'Неактивные' }
            ]}
          />
          
        </div>
      </div>

      {/* Таблица пользователей */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата регистрации
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'restaurant_owner' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'courier' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'admin' ? 'Администратор' :
                         user.role === 'super_admin' ? 'Супер Администратор' :
                         user.role === 'restaurant_owner' ? 'Владелец ресторана' :
                         user.role === 'courier' ? 'Курьер' :
                         'Клиент'}
                      </span>
                      {user.has_restaurants && user.restaurants_count && (
                        <span className="text-xs text-gray-500">
                          {user.restaurants_count} ресторан{user.restaurants_count === 1 ? '' : user.restaurants_count < 5 ? 'а' : 'ов'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Активен
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Неактивен
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={user.is_active ? 'Деактивировать' : 'Активировать'}
                      >
                        {user.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно создания пользователя */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmitUser)}>
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Создать пользователя</h2>
                <button 
                  type="button"
                  onClick={handleCloseModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  name="email"
                  label="Email"
                  required
                  {...register('email', { required: 'Email обязателен' })}
                  placeholder="user@example.com"
                  error={errors.email?.message}
                />

                <Input
                  type="text"
                  name="username"
                  label="Username"
                  required
                  {...register('username', { required: 'Username обязателен' })}
                  placeholder="username"
                  error={errors.username?.message}
                />

                <Input
                  type="text"
                  name="full_name"
                  label="Полное имя"
                  required
                  {...register('full_name', { required: 'Полное имя обязательно' })}
                  placeholder="Иван Иванов"
                  error={errors.full_name?.message}
                />

                <Input
                  type="password"
                  name="password"
                  label="Пароль"
                  required
                  {...register('password', { required: 'Пароль обязателен', minLength: { value: 6, message: 'Минимум 6 символов' } })}
                  placeholder="Минимум 6 символов"
                  error={errors.password?.message}
                />

                <Input
                  type="tel"
                  name="phone"
                  label="Телефон"
                  {...register('phone')}
                  placeholder="+7 (999) 123-45-67"
                />

                <Select
                  name="role"
                  label="Роль"
                  required
                  {...register('role', { required: 'Роль обязательна' })}
                  options={[
                    { value: 'customer', label: 'Клиент' },
                    { value: 'restaurant_owner', label: 'Владелец ресторана' },
                    { value: 'courier', label: 'Курьер' },
                    { value: 'admin', label: 'Администратор' }
                  ]}
                  error={errors.role?.message}
                />
              </div>

              <Input
                type="text"
                name="address"
                label="Адрес"
                {...register('address')}
                placeholder="г. Москва, ул. Примерная, д. 1"
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Активный пользователь
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={handleCloseModals}
                disabled={createUserMutation.isPending}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {createUserMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Создание...
                  </>
                ) : (
                  'Создать'
                )}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Модальное окно редактирования пользователя */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmitUser)}>
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Редактировать пользователя</h2>
                <button 
                  type="button"
                  onClick={handleCloseModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  name="email"
                  label="Email"
                  required
                  {...register('email', { required: 'Email обязателен' })}
                  placeholder="user@example.com"
                  error={errors.email?.message}
                />

                <Input
                  type="text"
                  name="username"
                  label="Username"
                  required
                  {...register('username', { required: 'Username обязателен' })}
                  placeholder="username"
                  error={errors.username?.message}
                />

                <Input
                  type="text"
                  name="full_name"
                  label="Полное имя"
                  required
                  {...register('full_name', { required: 'Полное имя обязательно' })}
                  placeholder="Иван Иванов"
                  error={errors.full_name?.message}
                />

                <Input
                  type="password"
                  name="password"
                  label="Новый пароль"
                  {...register('password', { minLength: { value: 6, message: 'Минимум 6 символов' } })}
                  placeholder="Минимум 6 символов"
                  helperText="Оставьте пустым, если не нужно менять"
                  error={errors.password?.message}
                />

                <Input
                  type="tel"
                  name="phone"
                  label="Телефон"
                  {...register('phone')}
                  placeholder="+7 (999) 123-45-67"
                />

                <Select
                  name="role"
                  label="Роль"
                  required
                  {...register('role', { required: 'Роль обязательна' })}
                  options={[
                    { value: 'customer', label: 'Клиент' },
                    { value: 'restaurant_owner', label: 'Владелец ресторана' },
                    { value: 'courier', label: 'Курьер' },
                    { value: 'admin', label: 'Администратор' }
                  ]}
                  error={errors.role?.message}
                />
              </div>

              <Input
                type="text"
                name="address"
                label="Адрес"
                {...register('address')}
                placeholder="г. Москва, ул. Примерная, д. 1"
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Активный пользователь
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={handleCloseModals}
                disabled={updateUserMutation.isPending}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  'Сохранить'
                )}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
