/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent restart loop in Docker by ignoring config file changes
  webpack: (config, { isServer }) => {
    // Ignore watching config files
    if (!isServer) {
      config.watchOptions = {
        ignored: ['**/next.config.js', '**/next.config.mjs', '**/node_modules']
      }
    }
    return config
  }
}

module.exports = nextConfig
