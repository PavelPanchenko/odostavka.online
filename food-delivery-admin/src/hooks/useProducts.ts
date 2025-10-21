import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  weight: string | null;
  brand: string | null;
  barcode: string | null;
  is_available: boolean;
  is_discount: boolean;
  stock_quantity: number;
  category_id: number;
  category_name: string | null;
  created_at: string;
  updated_at: string | null;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  products_count: number;
}

interface ProductsParams {
  search?: string;
  category_id?: string;
  is_available?: string;
}

interface ProductCreate {
  name: string;
  description?: string | null;
  price: number;
  old_price?: number | null;
  image_url?: string | null;
  weight?: string | null;
  brand?: string | null;
  barcode?: string | null;
  is_available: boolean;
  is_discount: boolean;
  stock_quantity: number;
  category_id: number;
}

interface ProductUpdate {
  name?: string;
  description?: string | null;
  price?: number;
  old_price?: number | null;
  image_url?: string | null;
  weight?: string | null;
  brand?: string | null;
  barcode?: string | null;
  is_available?: boolean;
  is_discount?: boolean;
  stock_quantity?: number;
  category_id?: number;
}

// Загружаем все продукты один раз
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get<Product[]>('/admin/products');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
  });
}

// Загружаем все категории
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

// Клиентская фильтрация продуктов
export function useFilteredProducts(params: ProductsParams) {
  const { data: allProducts = [], ...queryState } = useProducts();
  
  const filteredProducts = allProducts.filter(product => {
    // Фильтр по поиску (клиентский)
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower)) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Фильтр по категории
    if (params.category_id) {
      if (product.category_id.toString() !== params.category_id) {
        return false;
      }
    }
    
    // Фильтр по доступности
    if (params.is_available) {
      const isAvailable = params.is_available === 'true';
      if (product.is_available !== isAvailable) {
        return false;
      }
    }
    
    return true;
  });
  
  return {
    ...queryState,
    data: filteredProducts,
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData: ProductCreate) => {
      const response = await api.post('/admin/products', productData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductUpdate }) => {
      const response = await api.put(`/admin/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/admin/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
