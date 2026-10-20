import { defineConfig } from 'vitest/config'

// Slow suites: materialized bootstrap, screenshot helper, and production verification (Chromium).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
