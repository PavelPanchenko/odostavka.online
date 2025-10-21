import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  images: {
    domains: process.env.NEXT_PUBLIC_API_DOMAIN ? [process.env.NEXT_PUBLIC_API_DOMAIN] : ['localhost'],
  },
  experimental: {
    // outputFileTracingRoot больше не поддерживается в новых версиях Next.js
  },
};

export default nextConfig;
