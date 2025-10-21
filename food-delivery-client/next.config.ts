import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // @ts-ignore - allowedDevOrigins для ngrok
    allowedDevOrigins: ['https://be36e5e456de.ngrok-free.app'],
    outputFileTracingRoot: undefined,
  },
};

export default nextConfig;
