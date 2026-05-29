import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://aura-chat.io.vn:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://aura-chat.io.vn:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
