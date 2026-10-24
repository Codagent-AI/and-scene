import { defineConfig } from 'vitest/config'

// Subprocess, filesystem, and browser-backed integration and end-to-end suites.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/slow/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
})
