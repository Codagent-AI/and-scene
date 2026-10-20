import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only (`npm test`). Browser-backed suites have their own configs.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}', 'tests/contract/**/*.test.ts'],
    setupFiles: ['tests/helpers/setup.ts'],
    testTimeout: 15000,
  },
})
