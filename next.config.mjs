/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Increase payload limit for base64 photo strip uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
