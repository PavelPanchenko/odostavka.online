import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

interface UsersParams {
  search?: string;
  role?: string;
  is_active?: string;
}

interface AdminUserCreate {
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: string;
  is_active: boolean;
  password: string;
}

interface AdminUserUpdate {
  email?: string;
  username?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  role?: string;
  is_active?: boolean;
  password?: string;
}

// Загружаем всех пользователей один раз
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get<User[]>('/admin/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
  });
}

// Клиентская фильтрация пользователей
export function useFilteredUsers(params: UsersParams) {
  const { data: allUsers = [], ...queryState } = useUsers();
  
  const filteredUsers = allUsers.filter(user => {
    // Фильтр по поиску (клиентский)
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      const matchesSearch = 
        user.full_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Улучшенный фильтр по роли
    if (params.role) {
      if (params.role === 'restaurant_owner') {
        // Для роли "Владелец ресторана" показываем пользователей с ролью restaurant_owner
        // ИЛИ пользователей с ресторанами (даже если их роль customer)
        if (user.role !== 'restaurant_owner' && !user.has_restaurants) {
          return false;
        }
      } else {
        // Для других ролей фильтруем строго по роли
        if (user.role !== params.role) {
          return false;
        }
      }
    }
    
    // Фильтр по статусу
    if (params.is_active) {
      const isActive = params.is_active === 'true';
      if (user.is_active !== isActive) {
        return false;
      }
    }
    
    return true;
  });
  
  return {
    ...queryState,
    data: filteredUsers,
  };
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: AdminUserCreate) => {
      const response = await api.post('/admin/users', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AdminUserUpdate }) => {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

