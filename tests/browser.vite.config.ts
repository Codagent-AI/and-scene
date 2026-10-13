import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/browser-tests',
    rollupOptions: { input: 'tests/fixtures/scene-kit/index.html' },
  },
})
