import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Firebase popup (signInWithPopup) requires Cross-Origin-Opener-Policy: unsafe-none
    // Without this, Chrome blocks window.closed checks and the popup flow fails
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    proxy: {
      '/api': {
        target: 'http://32.193.155.80:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://32.193.155.80:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
