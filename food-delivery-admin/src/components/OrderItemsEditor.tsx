'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Package, DollarSign, Minus } from 'lucide-react';
import { OrderItem } from '@/hooks/useOrders';
import { api } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  old_price?: number;
  image_url?: string;
  weight?: string;
  brand?: string;
  is_discount?: boolean;
  stock_quantity?: number;
  category_id?: number;
  category_name?: string;
}

interface OrderItemsEditorProps {
  orderId: number;
  items: OrderItem[];
  onSave: (items: OrderItem[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function OrderItemsEditor({ 
  orderId, 
  items, 
  onSave, 
  onCancel, 
  loading = false 
}: OrderItemsEditorProps) {
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualProduct, setManualProduct] = useState({
    name: '',
    price: 0,
    quantity: 1
  });

  useEffect(() => {
    setEditedItems([...items]);
  }, [items]);

  useEffect(() => {
    calculateTotal();
  }, [editedItems]);

  const calculateTotal = () => {
    const total = editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalAmount(total);
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setEditedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handlePriceChange = (itemId: number, newPrice: number) => {
    if (newPrice < 0) return;
    
    setEditedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, price: newPrice }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId: number) => {
    setEditedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddProduct = async () => {
    setLoadingProducts(true);
    try {
      // Используем общий endpoint для получения продуктов
      const response = await api.get('/admin/products', {
        params: {
          search: searchQuery,
          limit: 20,
          is_available: true
        }
      });
      setAvailableProducts(response.data);
      setShowProductSelector(true);
    } catch (error: any) {
      console.error('Ошибка загрузки продуктов:', error);
      // Если API недоступен, предлагаем ручное добавление
      if (error.response?.status === 404 || error.response?.status === 401) {
        setShowManualAdd(true);
        setShowProductSelector(false);
      } else {
        console.error('Неизвестная ошибка:', error.message);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    const newItem: OrderItem = {
      id: Date.now(), // Временный ID для новых товаров
      product_id: product.id,
      quantity: 1,
      price: product.price,
      product_name: product.name,
      product_image: product.image_url
    };
    
    setEditedItems(prev => [...prev, newItem]);
    setShowProductSelector(false);
    setSearchQuery('');
  };

  const handleManualAdd = () => {
    if (!manualProduct.name || manualProduct.price <= 0) return;
    
    const newItem: OrderItem = {
      id: Date.now(),
      product_id: -1, // Специальный ID для ручно добавленных товаров
      quantity: manualProduct.quantity,
      price: manualProduct.price,
      product_name: manualProduct.name,
      product_image: undefined
    };
    
    setEditedItems(prev => [...prev, newItem]);
    setShowManualAdd(false);
    setManualProduct({ name: '', price: 0, quantity: 1 });
  };

  const handleSave = async () => {
    try {
      await onSave(editedItems);
    } catch (error) {
      console.error('Ошибка сохранения товаров:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Товары в заказе</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddProduct}
            disabled={loadingProducts}
            className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loadingProducts ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Добавить товар
          </button>
        </div>
      </div>

      {/* Поиск товаров */}
      {showProductSelector && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Поиск
            </button>
            <button
              onClick={() => setShowProductSelector(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Отмена
            </button>
          </div>

          {/* Список доступных товаров */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {availableProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50"
              >
                <div className="flex items-center">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-12 w-12 object-cover rounded-lg mr-3"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.brand}</p>
                    <p className="text-sm font-semibold text-green-600">
                      ₽{product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectProduct(product)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Добавить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ручное добавление товара */}
      {showManualAdd && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Добавить товар вручную</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название товара
              </label>
              <input
                type="text"
                value={manualProduct.name}
                onChange={(e) => setManualProduct(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Введите название товара"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена за штуку
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualProduct.price}
                  onChange={(e) => setManualProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество
                </label>
                <input
                  type="number"
                  min="1"
                  value={manualProduct.quantity}
                  onChange={(e) => setManualProduct(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleManualAdd}
                disabled={!manualProduct.name || manualProduct.price <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Добавить товар
              </button>
              <button
                onClick={() => setShowManualAdd(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список товаров в заказе */}
      <div className="space-y-3">
        {editedItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center flex-1">
              {item.product_image && (
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="h-12 w-12 object-cover rounded-lg mr-4"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                <p className="text-sm text-gray-500">ID: {item.product_id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Количество */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Цена за штуку */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Цена:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Общая стоимость */}
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ₽{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>

              {/* Кнопка удаления */}
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {editedItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>В заказе нет товаров</p>
            <p className="text-sm">Нажмите "Добавить товар" чтобы добавить товары</p>
          </div>
        )}
      </div>

      {/* Итого */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-lg font-semibold text-gray-900">Итого:</span>
          </div>
          <span className="text-2xl font-bold text-green-600">
            ₽{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : null}
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
}
