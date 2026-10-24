import { defineConfig } from 'vitest/config'

// Slower, browser-backed and filesystem-heavy suites (`npm run test:integration`, `npm run test:e2e`).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    testTimeout: 240_000,
    hookTimeout: 480_000,
    fileParallelism: false,
  },
})
