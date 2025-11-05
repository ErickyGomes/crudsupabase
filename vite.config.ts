import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Excluir parquetjs das otimizações (pode causar problemas com módulos Node.js)
    exclude: ['parquetjs'],
  },
})
