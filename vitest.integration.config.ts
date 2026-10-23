import { defineConfig } from 'vitest/config'

// INT-001 / INT-002: real filesystem, subprocesses and a production browser.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
