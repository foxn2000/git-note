import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/jp': {
        target: 'http://localhost:5173',
        rewrite: (path) => path.replace(/^\/jp/, '')
      }
    }
  }
})
