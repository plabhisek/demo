import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    allowedHosts: ['shm.eslsteel.com'],
    port: 3000,
    open: true,
  },
  // Specify the correct entry point
  optimizeDeps: {
    entries: ['./src/index.jsx']
  }
})