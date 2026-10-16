import { defineConfig } from 'vitest/config'

// Browser- and filesystem-backed suites (INT-*, E2E-*); they install dependencies and launch Chromium.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
