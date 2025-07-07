/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        const backendUrl = 'https://chatanalysis.webhop.me';

        return [
            { source: '/analyze',       destination: `${backendUrl}/analyze` },
            { source: '/filter',        destination: `${backendUrl}/filter` },
            { source: '/data/:path*',   destination: `${backendUrl}/data/:path*` },
            { source: '/process',       destination: `${backendUrl}/process` },
            { source: '/search/:path*', destination: `${backendUrl}/search/:path*` },
            { source: '/tasks/:path*',  destination: `${backendUrl}/tasks/:path*` },
        ];
    },
};

module.exports = nextConfig;