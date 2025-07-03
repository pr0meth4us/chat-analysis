/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        if (process.env.NODE_ENV === 'development') {
            return [
                { source: '/analyze',       destination: 'http://13.55.48.245:5328/analyze' },
                { source: '/filter',        destination: 'http://13.55.48.245:5328/filter' },
                { source: '/data/:path*',   destination: 'http://13.55.48.245:5328/data/:path*' },
                { source: '/process',       destination: 'http://13.55.48.245:5328/process' },
                { source: '/search/:path*', destination: 'http://13.55.48.245:5328/search/:path*' },
                { source: '/tasks/:path*',  destination: 'http://13.55.48.245:5328/tasks/:path*' },
            ];
        } else {
            // Production also uses the same backend
            return [
                { source: '/analyze',       destination: 'http://13.55.48.245:5328/analyze' },
                { source: '/filter',        destination: 'http://13.55.48.245:5328/filter' },
                { source: '/data/:path*',   destination: 'http://13.55.48.245:5328/data/:path*' },
                { source: '/process',       destination: 'http://13.55.48.245:5328/process' },
                { source: '/search/:path*', destination: 'http://13.55.48.245:5328/search/:path*' },
                { source: '/tasks/:path*',  destination: 'http://13.55.48.245:5328/tasks/:path*' },
            ];
        }
    },
};

module.exports = nextConfig;