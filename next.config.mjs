/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000, // Her 1 saniyede bir değişiklik var mı diye kontrol et
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
