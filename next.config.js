/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Exclude fleet-app directory from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig

