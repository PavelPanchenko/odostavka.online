'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Global Error Handler
 * Обрабатывает критические ошибки на уровне root layout
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
    // TODO: Отправить в Sentry
  }, [error]);

  return (
    <html lang="ru">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '400px', 
          padding: '32px', 
          textAlign: 'center' 
        }}>
          <div style={{
            width: '96px',
            height: '96px',
            margin: '0 auto 24px',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle 
              style={{ width: '48px', height: '48px', color: '#dc2626' }} 
            />
          </div>

          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#111827',
            marginBottom: '12px'
          }}>
            Критическая ошибка
          </h1>

          <p style={{ 
            color: '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            Приложение столкнулось с критической ошибкой. Пожалуйста, перезагрузите страницу.
          </p>

          <button
            onClick={reset}
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
          >
            Перезагрузить приложение
          </button>
        </div>
      </body>
    </html>
  );
}

