'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Store, 
  BarChart3,
  Settings,
  LogOut,
  Tag,
  Truck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Дашборд', href: '/', icon: LayoutDashboard },
  { name: 'Пользователи', href: '/users', icon: Users },
  { name: 'Продукты', href: '/products', icon: Package },
  { name: 'Категории', href: '/categories', icon: Tag },
  { name: 'Заказы', href: '/orders', icon: ShoppingCart },
  { name: 'Рестораны', href: '/restaurants', icon: Store },
  { name: 'Доставка', href: '/delivery', icon: Truck },
  { name: 'Аналитика', href: '/analytics', icon: BarChart3 },
  { name: 'Настройки', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-green-600">
        <h1 className="text-xl font-bold text-white">Админ панель</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout - показываем только если пользователь залогинен */}
      {user && (
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
