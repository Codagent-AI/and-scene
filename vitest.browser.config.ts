import { defineConfig } from 'vitest/config'

// Slower subprocess and browser-backed suites (`npm run test:integration`, `npm run test:e2e`).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
