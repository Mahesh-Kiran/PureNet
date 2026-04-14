import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Backend API
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      // Cloudflare speed test — real CDN edge servers worldwide
      // This is how ALL production speed tests work (fast.com uses Netflix CDN,
      // speedtest.net uses Ookla servers). We use Cloudflare's public speed test
      // infrastructure which routes to the nearest edge server.
      '/cf-speed': {
        target: 'https://speed.cloudflare.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cf-speed/, ''),
      },
      // Cloudflare trace — returns real client IP, country, edge server location
      '/cf-trace': {
        target: 'https://speed.cloudflare.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cf-trace/, '/cdn-cgi/trace'),
      }
    }
  }
})