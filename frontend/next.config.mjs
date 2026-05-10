<<<<<<< HEAD
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

=======
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // <-- ADDED THIS LINE

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
<<<<<<< HEAD
  // Safety net for any legacy relative API requests. App code should use API_URL directly.
=======
  // This rewrites configuration will proxy API requests from your frontend
  // to your backend server, solving the CORS issue.
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
  async rewrites() {
    return [
      {
        source: '/api/:path*',
<<<<<<< HEAD
        destination: `${apiUrl}/api/:path*`,
=======
        destination: 'http://localhost:5000/api/:path*',
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
      },
    ]
  },
};

<<<<<<< HEAD
export default nextConfig;
=======
export default nextConfig;
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
