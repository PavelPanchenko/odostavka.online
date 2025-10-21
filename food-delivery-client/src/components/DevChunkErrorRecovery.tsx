'use client';

import { useEffect } from 'react';

export default function DevChunkErrorRecovery() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handler = (event: ErrorEvent) => {
      const message = String(event?.message || '');
      const isChunkLoadError =
        message.includes('Loading chunk') ||
        message.includes('ChunkLoadError') ||
        message.includes('Failed to fetch dynamically imported module');

      if (isChunkLoadError) {
        // Сбрасываем кэш next/chunks и делаем жесткий перезагруз
        try {
          if ('caches' in window) {
            caches.keys().then((keys) => {
              keys.forEach((k) => {
                if (k.includes('next') || k.includes('workbox') || k.includes('webpack')) {
                  caches.delete(k);
                }
              });
            });
          }
        } catch {}
        // Перезагружаем страницу целиком, чтобы получить свежие чанки
        window.location.reload();
      }
    };

    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  return null;
}


