'use client';

import { ProductCategory } from '@/lib/api';

interface CategoryCardProps {
  category: ProductCategory;
  isActive: boolean;
  onClick: () => void;
}

export default function CategoryCard({ category, isActive, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-1 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-green-500 text-white shadow-lg transform scale-105'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:text-green-600'
      }`}
    >
      <div className="text-lg mb-0.5">
        {category.image_url || '🛒'}
      </div>
      <span className="text-xs font-medium text-center leading-none px-0.5 truncate">
        {category.name}
      </span>
    </button>
  );
}
