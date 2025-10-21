import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  products_count: number;
}

interface CategoriesParams {
  search?: string;
  is_active?: string;
}

interface CategoryCreate {
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
}

interface CategoryUpdate {
  name?: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

// Загружаем все категории один раз
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<Category[]>('/admin/categories');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 минут - категории меняются реже
  });
}

// Клиентская фильтрация категорий
export function useFilteredCategories(params: CategoriesParams) {
  const { data: allCategories = [], ...queryState } = useCategories();
  
  const filteredCategories = allCategories.filter(category => {
    // Фильтр по поиску (клиентский)
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      const matchesSearch = 
        category.name.toLowerCase().includes(searchLower) ||
        (category.description && category.description.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Фильтр по статусу
    if (params.is_active) {
      const isActive = params.is_active === 'true';
      if (category.is_active !== isActive) return false;
    }
    
    return true;
  });
  
  return {
    ...queryState,
    data: filteredCategories,
  };
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryData: CategoryCreate) => {
      const response = await api.post('/admin/categories', categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryUpdate }) => {
      const response = await api.put(`/admin/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/admin/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
