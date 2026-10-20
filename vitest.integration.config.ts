import { defineConfig } from 'vitest/config'

// Slower tests that need subprocesses, a production build, or Chromium.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
})
