import { defineConfig } from 'vitest/config'

// Browser-backed and subprocess suites (INT-001, INT-002, E2E-002, motion fixtures).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 240_000,
    hookTimeout: 240_000,
    fileParallelism: false,
  },
})
