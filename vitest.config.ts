import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only; slower suites live in vitest.integration.config.ts.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs', 'skills/**/*.test.mjs'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
