import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '@/lib/api';

export const useFavorites = () => {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => productsAPI.getFavorites(),
    staleTime: 2 * 60 * 1000, // 2 минуты
  });
};

export const useAddToFavorites = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId: number) => productsAPI.addToFavorites(productId),
    onSuccess: () => {
      // Обновляем кэш избранного
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId: number) => productsAPI.removeFromFavorites(productId),
    onSuccess: () => {
      // Обновляем кэш избранного
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};
