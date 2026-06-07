import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://32.195.171.12:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Firebase popup requires these headers
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
      },
      '/ws': {
        target: BACKEND.replace('http', 'ws'),
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
