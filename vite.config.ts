import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from '@rollup/plugin-yaml'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), yaml()],
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
