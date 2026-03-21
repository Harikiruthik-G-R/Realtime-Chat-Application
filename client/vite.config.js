import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: 'all',
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://realchat-server:5000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    force: true
  }
})