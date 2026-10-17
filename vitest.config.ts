import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Fast unit and contract tests only; slower suites live in vitest.integration.config.ts.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}', 'skills/**/*.test.{ts,mjs}'],
    exclude: ['**/templates/**', '**/node_modules/**'],
  },
})
