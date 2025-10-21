'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  type: 'order' | 'news';
  createdAt: number;
  read?: boolean;
}

function getRecentOrdersCount(): number {
  try {
    const raw = localStorage.getItem('newOrders');
    if (!raw) return 0;
    const now = Date.now();
    const items = JSON.parse(raw);
    const recent = (Array.isArray(items) ? items : []).filter((x: any) => now - x.timestamp < 5 * 60 * 1000);
    if (recent.length !== (items?.length || 0)) {
      localStorage.setItem('newOrders', JSON.stringify(recent));
    }
    return recent.length;
  } catch {
    return 0;
  }
}

function getNewsCount(): number {
  try {
    const raw = localStorage.getItem('news');
    if (!raw) return 0;
    const items: NotificationItem[] = JSON.parse(raw) || [];
    return items.filter(n => !n.read).length;
  } catch {
    return 0;
  }
}

export default function NotificationBell() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [newsCount, setNewsCount] = useState(0);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isMounted) return;
    const tick = () => {
      setOrderCount(getRecentOrdersCount());
      setNewsCount(getNewsCount());
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, [isMounted]);

  const total = orderCount + newsCount;

  const openOrders = () => {
    setOpen(false);
    router.push('/orders');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        aria-label="Уведомления"
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-30">
          <div className="p-3 border-b border-gray-100 font-semibold text-sm">Уведомления</div>
          <div className="max-h-72 overflow-auto">
            {total === 0 ? (
              <div className="p-3 text-sm text-gray-500">Пока нет новых уведомлений</div>
            ) : (
              <div className="p-2 space-y-1">
                {orderCount > 0 && (
                  <button onClick={openOrders} className="w-full text-left p-2 rounded-lg hover:bg-gray-50">
                    <div className="text-sm font-medium">Новые заказы: {orderCount}</div>
                    <div className="text-xs text-gray-500">Открыть список заказов</div>
                  </button>
                )}
                {newsCount > 0 && (
                  <div className="p-2 rounded-lg bg-yellow-50 text-yellow-800 text-sm">
                    Новые новости: {newsCount}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


