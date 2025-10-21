'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { useUniversalCart } from '@/hooks/useUniversalCart';
import { useFavoritesStore } from '@/store/favorites';
import { useProducts, useCategories } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { Product, ProductCategory } from '@/lib/api';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryNavRef = useRef<HTMLDivElement>(null);
  
  const { addItem, removeItem, updateQuantity, getItemQuantity, getTotalItems } = useUniversalCart();
  const { addToFavorites, removeFromFavorites, isFavorite, loadFavoritesFromServer } = useFavoritesStore();

  // TanStack Query hooks
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: products = [], isLoading: productsLoading, error: productsError } = useProducts({
    category_id: selectedCategory || undefined,
    search: searchQuery || undefined,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Загружаем избранное с сервера при монтировании
  useEffect(() => {
    if (isMounted) {
      loadFavoritesFromServer();
    }
  }, [isMounted, loadFavoritesFromServer]);

  // Отслеживание скролла для эффекта прозрачности
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Объединяем состояния загрузки и ошибок
  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

  // Группируем продукты по категориям
  const productsByCategory = (products || []).reduce((acc, product) => {
    const categoryId = product.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category: product.category || { id: categoryId, name: 'Неизвестная категория', is_active: true, created_at: new Date().toISOString() },
        products: []
      };
    }
    acc[categoryId].products.push(product);
    return acc;
  }, {} as Record<number, { category: ProductCategory; products: Product[] }>);

  // Отслеживание активной категории при скролле
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScrollForCategory = () => {
      const categoryIds = Object.keys(productsByCategory).map(Number);
      const containerRect = scrollContainer.getBoundingClientRect();
      const stickyNavHeight = 60; // Высота sticky навигации
      
      // Ищем категорию, которая находится ближе всего к верху после sticky навигации
      let closestCategory: { id: number; distance: number } | null = null;
      
      for (const categoryId of categoryIds) {
        const element = document.getElementById(`category-${categoryId}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distanceFromTop = rect.top - containerRect.top - stickyNavHeight;
          
          // Если категория видна и находится в верхней части
          if (distanceFromTop >= -100 && distanceFromTop <= 200) {
            if (!closestCategory || distanceFromTop < closestCategory.distance) {
              closestCategory = { id: categoryId, distance: distanceFromTop };
            }
          }
        }
      }
      
      if (closestCategory) {
        setActiveCategory(closestCategory.id);
      }
    };

    scrollContainer.addEventListener('scroll', handleScrollForCategory);
    // Вызываем сразу для установки начального состояния
    handleScrollForCategory();
    
    return () => scrollContainer.removeEventListener('scroll', handleScrollForCategory);
  }, [productsByCategory]);

  // Автоматическая прокрутка навигации к активной категории
  useEffect(() => {
    if (activeCategory && categoryNavRef.current) {
      const activeButton = categoryNavRef.current.querySelector(`[data-category-id="${activeCategory}"]`) as HTMLElement;
      if (activeButton) {
        const navContainer = categoryNavRef.current;
        const buttonLeft = activeButton.offsetLeft;
        const buttonWidth = activeButton.offsetWidth;
        const containerWidth = navContainer.offsetWidth;
        const scrollLeft = navContainer.scrollLeft;
        
        // Вычисляем нужную позицию скролла, чтобы кнопка была по центру
        const targetScroll = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        
        navContainer.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [activeCategory]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: `product_${product.id}`,
      name: product.name,
      price: product.price,
      image: product.image_url
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    const currentQuantity = getCartQuantity(productId);
    updateQuantity(`product_${productId}`, currentQuantity - 1);
  };

  const getCartQuantity = (productId: number) => getItemQuantity(`product_${productId}`);

  const handleToggleFavorite = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        type: 'product'
      });
    }
  };

  const scrollToCategory = (categoryId: number) => {
    const scrollContainer = scrollContainerRef.current;
    const element = document.getElementById(`category-${categoryId}`);
    
    if (element && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const stickyNavHeight = 60; // Высота sticky навигации
      
      // Вычисляем позицию для скролла
      const scrollTop = scrollContainer.scrollTop;
      const targetPosition = scrollTop + (elementRect.top - containerRect.top) - stickyNavHeight - 10;
      
      scrollContainer.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      setActiveCategory(categoryId);
    }
  };

  if (!isMounted) {
    return null;
  }

  // Компонент скелетона
  const SkeletonLoader = () => (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Search Skeleton */}
          <div className="relative">
            <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="max-w-md mx-auto px-4 py-4 flex-shrink-0">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 h-9 w-20 bg-gray-200 rounded-full animate-pulse"
            ></div>
          ))}
        </div>
      </div>

      {/* Products Skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4">
          <div className="grid grid-cols-2 gap-3 py-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 overflow-hidden relative">
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                
                {/* Image skeleton */}
                <div className="w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-3"></div>
                
                {/* Title skeleton */}
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2"></div>
                
                {/* Price skeleton */}
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3 mb-3"></div>
                
                {/* Button skeleton */}
                <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">О.Доставка</h1>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">{(products || []).length} товаров</div>
              <NotificationBell />
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none focus:bg-white transition-all duration-200 placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Categories - Sticky Navigation */}
      <div className="sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div ref={categoryNavRef} className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {/* Кнопка "Все" для скролла в начало */}
            <button
              data-category-id="all"
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                !activeCategory || activeCategory === Object.keys(productsByCategory).map(Number)[0]
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Все
            </button>
            
            {Object.values(productsByCategory).map((categoryGroup) => (
              categoryGroup.category && (
                <button
                  key={categoryGroup.category.id}
                  data-category-id={categoryGroup.category.id}
                  onClick={() => scrollToCategory(categoryGroup.category.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeCategory === categoryGroup.category.id
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{categoryGroup.category.image_url}</span>
                  {categoryGroup.category.name}
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4">
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-lg mb-4">Ошибка загрузки данных</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : (products || []).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {searchQuery ? 'Товары не найдены' : 'Товары пока не добавлены'}
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-green-600 hover:text-green-700 transition-colors"
              >
                Очистить поиск
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {Object.values(productsByCategory).map((categoryGroup) => (
              <div key={categoryGroup.category?.id || 'uncategorized'}>
                {/* Category Header */}
                {categoryGroup.category && (
                  <div 
                    id={`category-${categoryGroup.category.id}`}
                    className="flex items-center gap-2 mb-3 scroll-mt-32"
                  >
                    <span className="text-lg">{categoryGroup.category.image_url}</span>
                    <h2 className="text-base font-bold text-gray-900">
                      {categoryGroup.category.name}
                    </h2>
                    <span className="text-xs text-gray-500">
                      {(categoryGroup.products || []).length}
                    </span>
                  </div>
                )}
                
                {/* Products Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {(categoryGroup.products || []).map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image_url}
                      description={product.description}
                      brand={product.brand}
                      oldPrice={product.old_price}
                      isDiscount={product.is_discount}
                      isAvailable={product.is_available}
                      isFavorite={isFavorite(product.id)}
                      cartQuantity={getCartQuantity(product.id)}
                      onToggleFavorite={() => handleToggleFavorite(product)}
                      onAddToCart={() => handleAddToCart(product)}
                      onRemoveFromCart={() => handleRemoveFromCart(product.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}