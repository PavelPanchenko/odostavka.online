'use client';

import { Heart, ShoppingCart, Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  brand?: string;
  oldPrice?: number;
  isDiscount?: boolean;
  isAvailable?: boolean;
  isFavorite: boolean;
  cartQuantity: number;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  description,
  brand,
  oldPrice,
  isDiscount = false,
  isAvailable = true,
  isFavorite,
  cartQuantity,
  onToggleFavorite,
  onAddToCart,
  onRemoveFromCart,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      {/* Favorite Button */}
      <button
        onClick={onToggleFavorite}
        className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors z-10"
      >
        <Heart 
          className={`h-3 w-3 ${
            isFavorite
              ? 'text-red-500 fill-current' 
              : 'text-gray-400'
          }`} 
        />
      </button>

      {/* Product Image */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-3 overflow-hidden group">
        {image ? (
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl">🛒</div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">
          {name}
        </h3>
        
        {/* Brand and Description */}
        <div className="space-y-0.5">
          {brand && (
            <p className="text-xs text-blue-600 font-semibold">
              {brand}
            </p>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 line-clamp-1">
              {description}
            </p>
          )}
        </div>
        
        {/* Price Section */}
        <div className="pt-1">
          {isDiscount && oldPrice ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-green-600">
                  {price} ₽
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {oldPrice} ₽
                </span>
              </div>
              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">
                -{Math.round(((oldPrice - price) / oldPrice) * 100)}%
              </span>
            </div>
          ) : (
            <span className="text-base font-bold text-gray-900">
              {price} ₽
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        {!isAvailable ? (
          <div className="w-full bg-gray-100 text-gray-500 py-2 rounded-xl text-xs font-semibold text-center">
            Недоступно
          </div>
        ) : cartQuantity > 0 ? (
          <div className="flex items-center justify-between bg-green-50 rounded-xl p-2">
            <button
              onClick={onRemoveFromCart}
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="font-bold text-gray-900 text-sm">
              {cartQuantity}
            </span>
            <button
              onClick={onAddToCart}
              className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={onAddToCart}
            className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center text-sm font-semibold shadow-sm"
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            В корзину
          </button>
        )}
      </div>
    </div>
  );
}

