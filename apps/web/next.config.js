/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['ozerus-ds'],
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${process.env.API_PROXY_URL || 'http://localhost:4000'}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
