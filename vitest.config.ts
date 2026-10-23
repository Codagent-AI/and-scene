import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only. Slower suites: vitest.integration.config.ts.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    testTimeout: 20_000,
    setupFiles: ['tests/setup.ts'],
  },
})
