import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // <-- ADDED THIS LINE
  outputFileTracingRoot: __dirname,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Safety net for any legacy relative API requests. App code should use API_URL directly.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;
