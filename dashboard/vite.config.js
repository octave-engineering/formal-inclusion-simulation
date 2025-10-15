import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  base: '/formal-inclusion-simulation/',
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files > 1KB
      deleteOriginFile: false
    })
  ],
  server: {
    port: 3001,
    open: true,
    host: '0.0.0.0', // Allow external access
    allowedHosts: ['9aeb0ec6f289.ngrok-free.app', '127.0.0.1', '0.0.0.0'],
    cors: true,
    headers: {
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts']
        }
      }
    }
  }
})
