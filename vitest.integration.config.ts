import { defineConfig } from 'vitest/config'

// INT-001 and INT-002: real filesystem materialization, installs, and Chromium.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
