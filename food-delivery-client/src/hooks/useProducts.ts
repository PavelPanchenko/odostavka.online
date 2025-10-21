import { useQuery } from '@tanstack/react-query';
import { productsAPI, Product, ProductCategory } from '@/lib/api';

export const useProducts = (params?: {
  skip?: number;
  limit?: number;
  category_id?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsAPI.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getProduct(id),
    enabled: !!id,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => productsAPI.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 минут
  });
};
