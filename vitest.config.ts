import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only. Slower suites: vitest.integration.config.ts.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
})
