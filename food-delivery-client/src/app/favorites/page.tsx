'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Trash2 } from 'lucide-react';
import { useFavoritesStore } from '@/store/favorites';
import { useUniversalCart } from '@/hooks/useUniversalCart';
import ProductCard from '@/components/ProductCard';
import showToast from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, removeFromFavorites, clearFavorites, loadFavoritesFromServer, isLoading } = useFavoritesStore();
  const { addItem, updateQuantity, getItemQuantity } = useUniversalCart();
  const [isMounted, setIsMounted] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Загружаем избранное с сервера при монтировании
  useEffect(() => {
    if (isMounted) {
      loadFavoritesFromServer();
    }
  }, [isMounted, loadFavoritesFromServer]);

  const handleAddToCart = (item: any) => {
    addItem({
      id: `product_${item.id}`,
      name: item.name,
      price: item.price || 0,
      image: item.image,
    });
  };

  const handleRemoveFromCart = (itemId: number) => {
    const currentQuantity = getItemQuantity(`product_${itemId}`);
    updateQuantity(`product_${itemId}`, currentQuantity - 1);
  };

  const getCartQuantity = (itemId: number) => getItemQuantity(`product_${itemId}`);

  const handleClearFavorites = () => {
    clearFavorites();
    showToast.success('Избранное очищено');
  };

  if (!isMounted || isLoading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-500 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Избранное</h1>
              <p className="text-gray-500 text-xs">{favorites.length} товаров</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {favorites.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Избранное пусто</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Добавляйте понравившиеся товары
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors font-semibold"
            >
              Перейти в каталог
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-md mx-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                {favorites.map((item) => (
                  <ProductCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    price={item.price || 0}
                    image={item.image}
                    description={item.description}
                    brand={item.brand}
                    oldPrice={item.old_price}
                    isDiscount={item.is_discount}
                    isAvailable={true}
                    isFavorite={true}
                    cartQuantity={getCartQuantity(item.id)}
                    onToggleFavorite={() => removeFromFavorites(item.id)}
                    onAddToCart={() => handleAddToCart(item)}
                    onRemoveFromCart={() => handleRemoveFromCart(item.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 flex-shrink-0">
            <div className="max-w-md mx-auto px-4 py-4">
              <button
                onClick={() => setShowClearModal(true)}
                className="w-full text-red-600 py-3 text-sm hover:text-red-700 transition-colors flex items-center justify-center border border-red-200 rounded-xl hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Очистить избранное
              </button>
            </div>
          </div>
        </>
      )}

      {/* Clear Favorites Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearFavorites}
        title="Очистить избранное?"
        message="Все товары будут удалены из избранного. Вы всегда сможете добавить их снова."
        confirmText="Да, очистить"
        cancelText="Отмена"
        type="danger"
      />
    </div>
  );
}
