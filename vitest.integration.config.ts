import { defineConfig } from 'vitest/config'

// Slow, browser-backed suites; run with `npm run test:integration`.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    environment: 'node',
    testTimeout: 240_000,
    hookTimeout: 480_000,
    fileParallelism: false,
  },
})
