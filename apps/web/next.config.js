const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['ozerus-ds'],
  // Le proxy /api/* est assuré par le route handler app/api/[...path]/route.ts
  // (lecture de API_PROXY_URL au runtime + relais des cookies sans `Secure`).
  // Pas de rewrite ici : il serait figé au build et ne retirerait pas l'attribut
  // Secure des cookies (stack HTTP en local/docker).
};

module.exports = withNextIntl(nextConfig);
