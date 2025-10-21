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
  Plus,
  Package,
  Eye,
  EyeOff
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useFilteredProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';

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

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  old_price: number;
  image_url: string;
  weight: string;
  brand: string;
  barcode: string;
  is_available: boolean;
  is_discount: boolean;
  stock_quantity: number;
  category_id: number;
}

export default function ProductsPage() {
  const { user, loading } = useAuth();
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  
  // React Query hooks с клиентской фильтрацией
  const { data: products = [], isLoading: loadingProducts } = useFilteredProducts({ 
    search, // Без debounce - фильтрация мгновенная
    category_id: categoryFilter, 
    is_available: availabilityFilter 
  });
  const { data: categories = [] } = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);

  const [productModal, setProductModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    product?: Product;
  } | null>(null);

  // React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      old_price: 0,
      image_url: '',
      weight: '',
      brand: '',
      barcode: '',
      is_available: true,
      is_discount: false,
      stock_quantity: 0,
      category_id: 0
    }
  });


  const handleToggleAvailability = async (productId: number, currentStatus: boolean) => {
    try {
      await updateProductMutation.mutateAsync({
        id: productId,
        data: { is_available: !currentStatus }
      });
    } catch (error) {
      console.error('Ошибка обновления продукта:', error);
    }
  };

  const handleDeleteProduct = (productId: number, productName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Удалить продукт?',
      message: `Вы уверены, что хотите удалить продукт "${productName}"?\n\nЭто действие нельзя отменить.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteProductMutation.mutateAsync(productId);
        } catch (error) {
          console.error('Ошибка удаления продукта:', error);
        }
      }
    });
  };

  const handleCreateProduct = () => {
    reset({
      name: '',
      description: '',
      price: 0,
      old_price: 0,
      image_url: '',
      weight: '',
      brand: '',
      barcode: '',
      is_available: true,
      is_discount: false,
      stock_quantity: 0,
      category_id: 0
    });
    setProductModal({ isOpen: true, mode: 'create' });
  };

  const handleEditProduct = (product: Product) => {
    reset({
      name: product.name,
      description: product.description || '',
      price: product.price,
      old_price: product.old_price || 0,
      image_url: product.image_url || '',
      weight: product.weight || '',
      brand: product.brand || '',
      barcode: product.barcode || '',
      is_available: product.is_available,
      is_discount: product.is_discount,
      stock_quantity: product.stock_quantity,
      category_id: product.category_id
    });
    setProductModal({ isOpen: true, mode: 'edit', product });
  };

  const onSubmitProduct = async (data: ProductFormData) => {
    try {
      const productData = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        old_price: data.old_price || null,
        image_url: data.image_url || null,
        weight: data.weight || null,
        brand: data.brand || null,
        barcode: data.barcode || null,
        is_available: data.is_available,
        is_discount: data.is_discount,
        stock_quantity: data.stock_quantity,
        category_id: data.category_id
      };

      if (productModal?.mode === 'create') {
        await createProductMutation.mutateAsync(productData);
      } else if (productModal?.mode === 'edit' && productModal.product) {
        await updateProductMutation.mutateAsync({
          id: productModal.product.id,
          data: productData
        });
      }

      setProductModal(null);
    } catch (error) {
      console.error('Ошибка сохранения продукта:', error);
    }
  };

  if (loading || loadingProducts) {
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
          <h1 className="text-3xl font-bold text-gray-900">Продукты</h1>
          <p className="text-gray-600">Управление продуктами в магазине</p>
        </div>
        <button 
          onClick={handleCreateProduct}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить продукт
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск продуктов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Все категории</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Все статусы</option>
            <option value="true">Доступные</option>
            <option value="false">Недоступные</option>
          </select>
          
          <button
            onClick={() => {}} // Фильтрация происходит автоматически
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5 mr-2" />
            Применить
          </button>
        </div>
      </div>

      {/* Таблица продуктов */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Продукт
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Остаток
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {search || categoryFilter || availabilityFilter 
                          ? 'Продукты не найдены' 
                          : 'Нет продуктов'
                        }
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {search || categoryFilter || availabilityFilter
                          ? 'Попробуйте изменить параметры поиска'
                          : 'Добавьте первый продукт в магазин'
                        }
                      </p>
                      {!search && !categoryFilter && !availabilityFilter && (
                        <button
                          onClick={handleCreateProduct}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Добавить продукт
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.brand || 'Без бренда'}</div>
                        {product.weight && (
                          <div className="text-xs text-gray-400">{product.weight}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category_name || 'Без категории'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₽{product.price.toLocaleString()}
                    </div>
                    {product.old_price && product.old_price > product.price && (
                      <div className="text-xs text-gray-500 line-through">
                        ₽{product.old_price.toLocaleString()}
                      </div>
                    )}
                    {product.is_discount && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Скидка
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock_quantity} шт.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      product.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_available ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Доступен
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Недоступен
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleAvailability(product.id, product.is_available)}
                        className={`p-2 rounded-lg transition-colors ${
                          product.is_available 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={product.is_available ? 'Скрыть' : 'Показать'}
                      >
                        {product.is_available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* Модальное окно продукта */}
      {productModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmitProduct)} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {productModal.mode === 'create' ? 'Добавить продукт' : 'Редактировать продукт'}
                </h2>
                <button
                  type="button"
                  onClick={() => setProductModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название *
                    </label>
                    <input
                      type="text"
                      {...register('name', { 
                        required: 'Название обязательно',
                        minLength: { value: 2, message: 'Минимум 2 символа' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Введите название продукта"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Категория *
                    </label>
                    <select
                      {...register('category_id', { 
                        required: 'Категория обязательна',
                        valueAsNumber: true,
                        validate: value => value > 0 || 'Выберите категорию'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="0">Выберите категорию</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="text-xs text-red-600 mt-1">{errors.category_id.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    {...register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="Введите описание продукта"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цена *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price', { 
                        required: 'Цена обязательна',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Цена не может быть отрицательной' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Старая цена
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('old_price', { 
                        valueAsNumber: true,
                        min: { value: 0, message: 'Цена не может быть отрицательной' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                    {errors.old_price && (
                      <p className="text-xs text-red-600 mt-1">{errors.old_price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Количество на складе *
                    </label>
                    <input
                      type="number"
                      {...register('stock_quantity', { 
                        required: 'Количество обязательно',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Количество не может быть отрицательным' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                    {errors.stock_quantity && (
                      <p className="text-xs text-red-600 mt-1">{errors.stock_quantity.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Вес/объем
                    </label>
                    <input
                      type="text"
                      {...register('weight')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="500г, 1л, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Бренд
                    </label>
                    <input
                      type="text"
                      {...register('brand')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Название бренда"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Штрих-код
                    </label>
                    <input
                      type="text"
                      {...register('barcode')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Штрих-код"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL изображения
                  </label>
                  <input
                    type="url"
                    {...register('image_url')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('is_available')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Доступен для заказа</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('is_discount')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Скидка</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setProductModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {productModal.mode === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
