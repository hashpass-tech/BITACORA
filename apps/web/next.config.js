/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@bitacora/shared'],
  experimental: {
    optimizePackageImports: ['@bitacora/shared'],
  },
};

export default nextConfig;
