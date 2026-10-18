import { defineConfig } from 'vitest/config'

// Fast unit, contract, and component tests only. Browser-backed suites live in
// vitest.integration.config.ts.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx,mjs}'],
    setupFiles: ['src/tests/setup.ts'],
  },
})
