import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Fast unit and contract tests (`npm test`). Browser-backed suites live in
// vitest.integration.config.ts.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/helpers/setup.ts'],
    testTimeout: 15000,
  },
})
