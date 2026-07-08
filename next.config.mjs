/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static PWA — no backend in the core (Master Prompt §7.3).
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  trailingSlash: true,
};

export default nextConfig;
