import { defineConfig } from 'vitest/config'

// Slow, browser-backed suites (INT-001, INT-002, E2E-001, E2E-002); not part of `npm test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
})
