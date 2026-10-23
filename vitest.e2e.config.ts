import { defineConfig } from 'vitest/config'

// Production verification journeys (`npm run test:e2e`).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
