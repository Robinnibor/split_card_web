/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'salix5.github.io',
        port: '',
        pathname: '/query-data/pics/**',
      },
    ],
  },
}

module.exports = nextConfig
