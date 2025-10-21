'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Analytics компонент
 * Поддержка Google Analytics и Yandex Metrika
 */
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const YM_ID = process.env.NEXT_PUBLIC_YM_ID;

  // Track page views
  useEffect(() => {
    if (!pathname) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    // Google Analytics
    if (GA_ID && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', GA_ID, {
        page_path: url,
      });
    }

    // Yandex Metrika
    if (YM_ID && typeof window !== 'undefined' && (window as any).ym) {
      (window as any).ym(YM_ID, 'hit', url);
    }
  }, [pathname, searchParams, GA_ID, YM_ID]);

  return (
    <>
      {/* Google Analytics */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Yandex Metrika */}
      {YM_ID && (
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(${YM_ID}, "init", {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true
            });
          `}
        </Script>
      )}
    </>
  );
}

// Утилита для отправки событий
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const YM_ID = process.env.NEXT_PUBLIC_YM_ID;

  if (typeof window === 'undefined') return;

  // Google Analytics
  if (GA_ID && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
  }

  // Yandex Metrika
  if (YM_ID && (window as any).ym) {
    (window as any).ym(YM_ID, 'reachGoal', eventName, eventParams);
  }
};

