import { defineConfig } from 'vitest/config'

// Integration tests materialize files and run subprocesses or Chromium. Run one file at a time.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
})
