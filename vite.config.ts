import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', 
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          layout: ['react-grid-layout', 'react-resizable'],
          export: ['html2canvas', 'qrcode.react'],
          icons: ['lucide-react']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
