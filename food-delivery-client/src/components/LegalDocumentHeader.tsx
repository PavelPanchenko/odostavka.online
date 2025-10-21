'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface LegalDocumentHeaderProps {
  title: string;
  icon: React.ReactNode;
}

export default function LegalDocumentHeader({ title, icon }: LegalDocumentHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 flex-shrink-0">
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <div className="flex items-center space-x-2">
            {icon}
            <h1 className="text-xl font-bold text-gray-900">
              {title}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
