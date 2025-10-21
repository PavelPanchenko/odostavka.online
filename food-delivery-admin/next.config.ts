/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://odostavka.online/api',
    NEXT_PUBLIC_API_DOMAIN: process.env.NEXT_PUBLIC_API_DOMAIN || 'odostavka.online',
  },
  images: {
    domains: [
      process.env.NEXT_PUBLIC_API_DOMAIN || 'odostavka.online',
      'localhost' // для разработки
    ],
  },
  experimental: {
    // Убрать проблемные опции
  }
}

export default nextConfig