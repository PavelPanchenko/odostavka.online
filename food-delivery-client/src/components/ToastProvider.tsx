'use client';

import { Toaster } from 'react-hot-toast';

/**
 * Провайдер для toast уведомлений
 * Использует react-hot-toast
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        // Success
        success: {
          duration: 3000,
          style: {
            background: '#16a34a',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#16a34a',
          },
        },
        // Error
        error: {
          duration: 4000,
          style: {
            background: '#dc2626',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#dc2626',
          },
        },
        // Loading
        loading: {
          style: {
            background: '#3b82f6',
          },
        },
      }}
    />
  );
}

