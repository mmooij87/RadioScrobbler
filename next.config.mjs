const isProd = process.env.NODE_ENV === 'production';
const repoName = 'RadioScrobbler'; // Your repository name

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: isProd ? `/${repoName}` : '',
    assetPrefix: isProd ? `/${repoName}/` : '',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
