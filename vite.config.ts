
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  server: {
    proxy: {
      // Всі запити, що починаються з /api, будуть перенаправлені на наш бек-енд
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});