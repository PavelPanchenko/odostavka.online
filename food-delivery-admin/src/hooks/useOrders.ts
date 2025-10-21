import { useState } from 'react';
import { api } from '@/lib/api';
import { buildUrl } from '@/lib/url';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Order {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email?: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  delivery_phone: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  items_count?: number;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  product_image?: string;
}

export interface OrderFilters {
  search?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  user_id?: number;
  skip?: number;
  limit?: number;
}

export const useOrders = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Список заказов
  const fetchOrdersFn = async (filters: OrderFilters = {}) => {
    const url = buildUrl('/admin/orders', filters as Record<string, any>);
    const response = await api.get<Order[]>(url);
    return response.data;
  };

  const useOrdersQuery = (filters: OrderFilters = {}) =>
    useQuery<Order[], Error>({
      queryKey: ['admin-orders', filters],
      queryFn: () => fetchOrdersFn(filters),
      refetchInterval: 15000, // автообновление каждые 15 секунд
      staleTime: 10 * 1000,
    });

  // Заказ по id
  const fetchOrder = async (orderId: number): Promise<Order | null> => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки заказа');
      console.error('Ошибка загрузки заказа:', err);
      return null;
    }
  };

  // Мутации
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: number; updates: Partial<Order> }) => {
      const response = await api.put(`/admin/orders/${orderId}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || 'Ошибка обновления заказа');
    },
  });

  const updateOrderItemsMutation = useMutation({
    mutationFn: async ({ orderId, items }: { orderId: number; items: OrderItem[] }) => {
      const itemsData = items.map((item) => ({
        id: item.id > 0 ? item.id : undefined,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));
      const response = await api.put(`/admin/orders/${orderId}/items`, { items: itemsData });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || 'Ошибка обновления товаров заказа');
    },
  });

  const updateOrderStatus = async (orderId: number, status: string) => {
    await updateOrderMutation.mutateAsync({ orderId, updates: { status } });
  };

  const exportOrders = async (filters: OrderFilters = {}) => {
    try {
      try {
        const requestUrl = buildUrl('/admin/orders/export', filters as Record<string, any>);
        const response = await api.get(requestUrl, { responseType: 'blob' });
        const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
        return;
      } catch (apiError) {
        console.warn('API export failed, falling back to client-side export:', apiError);
      }

      const orders = await fetchOrdersFn(filters);
      const csvContent = generateCSV(orders);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fallbackBlobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fallbackBlobUrl;
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fallbackBlobUrl);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка экспорта заказов');
      console.error('Ошибка экспорта заказов:', err);
      throw err;
    }
  };

  const generateCSV = (ordersData: Order[]) => {
    const headers = [
      'ID заказа', 'ID клиента', 'Имя клиента', 'Email клиента',
      'Статус', 'Сумма', 'Адрес доставки', 'Телефон',
      'Примечания', 'Дата создания', 'Дата обновления'
    ];
    const rows = ordersData.map((order) => [
      order.id,
      order.user_id,
      order.user_name || '',
      order.user_email || '',
      order.status,
      order.total_amount,
      order.delivery_address,
      order.delivery_phone,
      order.notes || '',
      new Date(order.created_at).toLocaleString('ru-RU'),
      order.updated_at ? new Date(order.updated_at).toLocaleString('ru-RU') : ''
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');
    return '\uFEFF' + csvContent;
  };

  return {
    useOrdersQuery,
    fetchOrder,
    updateOrder: (orderId: number, updates: Partial<Order>) => updateOrderMutation.mutateAsync({ orderId, updates }),
    updateOrderItems: (orderId: number, items: OrderItem[]) => updateOrderItemsMutation.mutateAsync({ orderId, items }),
    updateOrderStatus,
    exportOrders,
    setError,
    error,
  };
};
