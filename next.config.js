/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['stripe']
  },
  swcMinify: true,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
}

module.exports = nextConfig 