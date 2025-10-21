'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  Tag,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useFilteredCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';

interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  products_count: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

export default function CategoriesPage() {
  const { user, loading } = useAuth();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // React Query hooks с клиентской фильтрацией
  const { data: categories = [], isLoading: loadingCategories } = useFilteredCategories({ 
    search, // Без debounce - фильтрация мгновенная
    is_active: statusFilter
  });
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);

  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    category?: Category;
  } | null>(null);

  // React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      image_url: '',
      is_active: true
    }
  });


  const handleToggleActive = async (categoryId: number, currentStatus: boolean) => {
    try {
      await updateCategoryMutation.mutateAsync({
        id: categoryId,
        data: { is_active: !currentStatus }
      });
    } catch (error) {
      console.error('Ошибка обновления категории:', error);
    }
  };

  const handleDeleteCategory = (categoryId: number, categoryName: string, productsCount: number) => {
    if (productsCount > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Нельзя удалить категорию',
        message: `Категория "${categoryName}" содержит ${productsCount} продуктов.\n\nСначала удалите или переместите все продукты из этой категории.`,
        type: 'warning',
        onConfirm: () => setConfirmDialog(null)
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Удалить категорию?',
      message: `Вы уверены, что хотите удалить категорию "${categoryName}"?\n\nЭто действие нельзя отменить.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteCategoryMutation.mutateAsync(categoryId);
        } catch (error) {
          console.error('Ошибка удаления категории:', error);
        }
      }
    });
  };

  const handleCreateCategory = () => {
    reset({
      name: '',
      description: '',
      image_url: '',
      is_active: true
    });
    setCategoryModal({ isOpen: true, mode: 'create' });
  };

  const handleEditCategory = (category: Category) => {
    reset({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active
    });
    setCategoryModal({ isOpen: true, mode: 'edit', category });
  };

  const onSubmitCategory = async (data: CategoryFormData) => {
    try {
      const categoryData = {
        name: data.name,
        description: data.description || null,
        image_url: data.image_url || null,
        is_active: data.is_active
      };

      if (categoryModal?.mode === 'create') {
        await createCategoryMutation.mutateAsync(categoryData);
      } else if (categoryModal?.mode === 'edit' && categoryModal.category) {
        await updateCategoryMutation.mutateAsync({
          id: categoryModal.category.id,
          data: categoryData
        });
      }

      setCategoryModal(null);
    } catch (error) {
      console.error('Ошибка сохранения категории:', error);
    }
  };

  if (loading || loadingCategories) {
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
          <h1 className="text-3xl font-bold text-gray-900">Категории продуктов</h1>
          <p className="text-gray-600">Управление категориями в магазине</p>
        </div>
        <button 
          onClick={handleCreateCategory}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить категорию
        </button>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск категорий..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Все статусы</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {/* Таблица категорий */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || statusFilter ? 'Категории не найдены' : 'Нет категорий'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search || statusFilter 
                ? 'Попробуйте изменить параметры поиска'
                : 'Добавьте первую категорию в магазин'
              }
            </p>
            {!search && !statusFilter && (
              <button
                onClick={handleCreateCategory}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Добавить категорию
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed" style={{width: '100%'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '25%'}}>
                    Категория
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%'}}>
                    Описание
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '10%'}}>
                    Продуктов
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                    Создана
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                          {category.image_url || <Tag className="h-5 w-5 text-gray-400" />}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 truncate" title={category.description || '—'}>
                        {category.description || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{category.products_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.is_active ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Активна
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Неактивна
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(category.id, category.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            category.is_active 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={category.is_active ? 'Деактивировать' : 'Активировать'}
                        >
                          {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name, category.products_count)}
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
        )}
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

      {/* Модальное окно категории */}
      {categoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <form onSubmit={handleSubmit(onSubmitCategory)} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {categoryModal.mode === 'create' ? 'Добавить категорию' : 'Редактировать категорию'}
                </h2>
                <button
                  type="button"
                  onClick={() => setCategoryModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
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
                    placeholder="Введите название категории"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    {...register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="Введите описание категории"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Эмодзи или URL изображения
                  </label>
                  <input
                    type="text"
                    {...register('image_url')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="🥛 или https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('is_active')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Активная категория</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setCategoryModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {categoryModal.mode === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
