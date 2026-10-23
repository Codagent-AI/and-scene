import { defineConfig } from 'vitest/config'

// INT-001 and INT-002: real filesystem materialization and Chromium.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 240_000,
    hookTimeout: 480_000,
    fileParallelism: false,
  },
})
