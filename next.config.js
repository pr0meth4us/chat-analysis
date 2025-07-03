/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        if (process.env.NODE_ENV === 'development') {
            return [
                { source: '/analyze',    destination: 'http://127.0.0.1:5328/analyze' },
                { source: '/filter',     destination: 'http://127.0.0.1:5328/filter' },
                { source: '/data/:path*',   destination: 'http://127.0.0.1:5328/data/:path*' },
                { source: '/process',    destination: 'http://127.0.0.1:5328/process' },
                { source: '/search/:path*', destination: 'http://127.0.0.1:5328/search/:path*' },
                { source: '/tasks/:path*',  destination: 'http://127.0.0.1:5328/tasks/:path*' },
            ];
        } else {
            const API = 'https://apparent-nadeen-aupp-54d2fac0.koyeb.app';
            return [
                { source: '/analyze',    destination: `${API}/analyze` },
                { source: '/filter',     destination: `${API}/filter` },
                { source: '/data/:path*',   destination: `${API}/data/:path*` },
                { source: '/process',    destination: `${API}/process` },
                { source: '/search/:path*', destination: `${API}/search/:path*` },
                { source: '/tasks/:path*',  destination: `${API}/tasks/:path*` },
            ];
        }
    },
};

module.exports = nextConfig;
