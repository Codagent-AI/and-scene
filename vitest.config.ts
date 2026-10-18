import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only. Browser-backed suites use vitest.integration.config.ts.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/support/setup.ts'],
  },
})
