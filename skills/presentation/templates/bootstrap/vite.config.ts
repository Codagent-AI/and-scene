import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/integration/**/*.{test,spec}.{ts,tsx}', 'tests/e2e/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
})
