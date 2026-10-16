import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

const buildTime = new Date().toLocaleString();

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-grid-layout') || id.includes('react-resizable')) {
            return 'layout'
          }
          if (id.includes('html2canvas') || id.includes('qrcode.react')) {
            return 'export'
          }
          if (id.includes('lucide-react')) {
            return 'icons'
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react'
          }
          return undefined
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
