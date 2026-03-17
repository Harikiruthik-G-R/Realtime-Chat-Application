import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    port: 3000,
    host: "0.0.0.0",   // 🔥 REQUIRED for Docker
    proxy: {
      '/api': {
        target: 'http://realchat-server:5000',  // ✅ FIXED
        changeOrigin: true,
      },
    },
  },
});