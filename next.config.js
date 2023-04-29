/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: true,
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      outputFileTracing: ['**canvas**'],
    };
    return config;
  },
};

export default nextConfig;
