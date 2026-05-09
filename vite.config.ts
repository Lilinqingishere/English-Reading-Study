import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const backendUrl = process.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000';

// https://vite.dev/config/
export default defineConfig({
  base: '/English-Reading-Study/',
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths(),
  ],
})
