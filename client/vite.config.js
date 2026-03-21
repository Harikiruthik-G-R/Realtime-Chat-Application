import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: ['a6ba8217557b84f778c27b2f5a2c6cc0-1658184173.ap-south-1.elb.amazonaws.com'],

    //CRITICAL FIX
    hmr: {
      host: 'ab8a872819bca473eba5881c9a8922c2-1431119845.ap-south-1.elb.amazonaws.com',
      protocol: 'ws',
      port: 3000
    },

    proxy: {
      '/api': {
        target: 'http://realchat-server:5000',
        changeOrigin: true,
      },
    },
  },
});