'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useUniversalCart } from '@/hooks/useUniversalCart';
import { ShoppingCart, User, Home, Heart } from 'lucide-react';

export default function Navbar() {
  const [isMounted, setIsMounted] = useState(false);
  const { getTotalItems } = useUniversalCart();
  const router = useRouter();
  const pathname = usePathname();
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Проверяем количество новых заказов
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      const checkNewOrders = () => {
        const newOrdersData = localStorage.getItem('newOrders');
        if (newOrdersData) {
          try {
            const data = JSON.parse(newOrdersData);
            const now = Date.now();
            // Фильтруем заказы не старше 5 минут (300000 миллисекунд)
            const recentOrders = (Array.isArray(data) ? data : []).filter((order: any) => now - order.timestamp < 300000);
            setNewOrdersCount(recentOrders.length);
          } catch (e) {
            console.error('Error checking new orders:', e);
          }
        } else {
          setNewOrdersCount(0);
        }
      };
      
      checkNewOrders();
      
      // Обновляем каждую секунду
      const interval = setInterval(checkNewOrders, 1000);
      return () => clearInterval(interval);
    }
  }, [isMounted, pathname]);

  const cartItemsCount = getTotalItems();

  return (
    <>
      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto px-4 pb-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-around py-3">
              <button
                onClick={() => router.push('/')}
                className={`p-3 transition-colors rounded-xl ${
                  pathname === '/' 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Home className="h-6 w-6" />
              </button>
              
              <button 
                onClick={() => router.push('/favorites')}
                className={`p-3 transition-colors rounded-xl ${
                  pathname === '/favorites' 
                    ? 'text-red-500 bg-red-100' 
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`h-6 w-6 ${
                  pathname === '/favorites' ? 'fill-current' : ''
                }`} />
              </button>
              
              <button 
                onClick={() => router.push('/cart')}
                className={`relative p-3 transition-colors rounded-xl ${
                  pathname === '/cart' 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <ShoppingCart className="h-6 w-6" />
                {isMounted && cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => router.push('/profile')}
                className={`relative p-3 transition-colors rounded-xl ${
                  pathname === '/profile' || pathname?.startsWith('/orders') || pathname?.startsWith('/settings')
                    ? 'text-blue-600 bg-blue-100' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <User className="h-6 w-6" />
                {isMounted && newOrdersCount > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 rounded-full h-2 w-2 animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
