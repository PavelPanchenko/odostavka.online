'use client';

import Navbar from './Navbar';

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  return (
    <div className="max-w-md mx-auto bg-gray-50 h-full flex flex-col shadow-2xl">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <Navbar />
    </div>
  );
}

