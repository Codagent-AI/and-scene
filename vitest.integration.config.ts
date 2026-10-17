import { defineConfig } from 'vitest/config'

// Slow integration and end-to-end suites: real filesystem, subprocesses and Chromium.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
})
