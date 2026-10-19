import { defineConfig } from 'vitest/config'

// Slower integration and end-to-end tests: real builds, Chromium, subprocesses.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/browser/**/*.test.ts'],
    testTimeout: 240_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
