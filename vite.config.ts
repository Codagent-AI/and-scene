import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@presentation-kit': path.resolve(__dirname, 'src/presentation-kit/index.ts') } },
})
