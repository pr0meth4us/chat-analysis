// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: 'http://127.0.0.1:5328/api/:path*',
          },
        ]
      : [
          {
            source: '/api/:path*',
            destination: 'https://apparent-nadeen-aupp-54d2fac0.koyeb.app/api/:path*',
          },
        ];
  },
};

module.exports = nextConfig;
