import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import QueryProvider from '@/providers/QueryProvider';
import LayoutContent from '@/components/LayoutContent';
import OfflineIndicator from '@/components/OfflineIndicator';
import InstallPWA from '@/components/InstallPWA';
import ToastProvider from '@/components/ToastProvider';
import Analytics from '@/components/Analytics';
import DevChunkErrorRecovery from '@/components/DevChunkErrorRecovery';
import SessionProvider from '@/providers/SessionProvider';
import AuthSync from '@/components/AuthSync';

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'О.Доставка - Доставка еды и продуктов',
  description: 'Заказ еды и продуктов с доставкой',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'О.Доставка',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
      { url: '/icons/icon-180x180.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="О.Доставка" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="О.Доставка" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#16a34a" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.svg" />
        
        {/* Register Service Worker only in production */}
        {process.env.NODE_ENV === 'production' ? (
          <script src="/register-sw.js" defer />
        ) : null}
      </head>
      <body className={`${inter.className} bg-gray-900 h-screen overflow-hidden`} suppressHydrationWarning>
        {/* Analytics */}
        <Analytics />
        {/* Dev recovery for ChunkLoadError */}
        <DevChunkErrorRecovery />
        
        <SessionProvider>
          <QueryProvider>
            <AuthProvider>
              {/* Синхронизация NextAuth с Zustand */}
              <AuthSync />
              
              {/* Toast Notifications */}
              <ToastProvider />
              
              {/* Offline Indicator */}
              <OfflineIndicator />
              
              {/* Install PWA Banner */}
              <InstallPWA />
              
              {/* Layout Content with conditional Navbar */}
              <LayoutContent>{children}</LayoutContent>
            </AuthProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}