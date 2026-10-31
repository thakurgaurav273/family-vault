import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      host: '0.0.0.0',
      proxy: { '/api': { target: 'http://localhost:5174', changeOrigin: false } },
    },
  };
});
