import { defineConfig } from 'vitest/config'

// Integration and end-to-end tests: production builds, subprocesses and Chromium.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/browser/**/*.test.{ts,mjs}'],
    testTimeout: 240_000,
    hookTimeout: 240_000,
    fileParallelism: false,
  },
})
