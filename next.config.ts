import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      { // Allow any hostname for user-provided image URLs. Be cautious in production.
        protocol: 'https',
        hostname: '**', 
      },
      {
        protocol: 'http', // Allow HTTP as well for flexibility
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;
