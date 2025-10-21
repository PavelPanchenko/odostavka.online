'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [newsCount, setNewsCount] = useState(0);
  const total = orderCount + clientCount + newsCount;
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [clientItems, setClientItems] = useState<any[]>([]);

  useEffect(() => {
    const tick = () => {
      try {
        const raw = localStorage.getItem('adminNewOrders');
        const now = Date.now();
        const items = raw ? JSON.parse(raw) : [];
        const list = (Array.isArray(items) ? items : []) as any[];
        const recent = list.filter((x) => now - x.ts < 5 * 60 * 1000);
        setOrderCount(recent.length);
        setOrderItems(recent.slice(-10).reverse());
      } catch {}
      try {
        const raw = localStorage.getItem('adminNewClients');
        const now = Date.now();
        const list = raw ? JSON.parse(raw) : [];
        const recent = (Array.isArray(list) ? list : []).filter((x: any) => now - x.ts < 5 * 60 * 1000);
        setClientCount(recent.length);
        setClientItems(recent.slice(-10).reverse());
      } catch {}
      try {
        const raw = localStorage.getItem('adminNews');
        const items = raw ? JSON.parse(raw) : [];
        setNewsCount((Array.isArray(items) ? items : []).filter((n: any) => !n.read).length);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Добро пожаловать, {user?.full_name || 'Администратор'}!
          </h2>
          <p className="text-sm text-gray-600">
            Управление системой доставки
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button onClick={() => setOpen(v => !v)} className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              {total > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{total}</span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-30">
                <div className="p-3 border-b border-gray-100 font-semibold text-sm">Уведомления</div>
                <div className="max-h-80 overflow-auto p-2 space-y-1">
                  {total === 0 ? (
                    <div className="p-2 text-sm text-gray-500">Новых уведомлений нет</div>
                  ) : (
                    <div className="space-y-2">
                      {orderCount > 0 && (
                        <div>
                          <div className="p-2 rounded-lg bg-green-50 text-green-800 text-sm font-medium">Новые заказы: {orderCount}</div>
                          <ul className="mt-1 space-y-1">
                            {orderItems.map((o: any, i) => (
                              <li key={i} className="text-sm text-gray-700 bg-white border border-gray-100 rounded-md px-2 py-1">Заказ #{o.id} — ₽{o.total ?? ''}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {clientCount > 0 && (
                        <div>
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-800 text-sm font-medium">Новые клиенты: {clientCount}</div>
                          <ul className="mt-1 space-y-1">
                            {clientItems.map((c: any, i) => (
                              <li key={i} className="text-sm text-gray-700 bg-white border border-gray-100 rounded-md px-2 py-1">{c.name || 'Клиент'} — {c.email || ''}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {newsCount > 0 && (
                        <div className="p-2 rounded-lg bg-yellow-50 text-yellow-800 text-sm">Новости: {newsCount}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
