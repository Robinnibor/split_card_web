/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/nyckel.server.production/Samples/sw3j7knfy7fqfko1/**',
      },
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
