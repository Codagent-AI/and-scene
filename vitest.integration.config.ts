import { defineConfig } from 'vitest/config'

// `npm run test:integration`: browser-backed and filesystem integration/end-to-end tests.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    environment: 'node',
    testTimeout: 240000,
    hookTimeout: 480000,
    fileParallelism: false,
    maxConcurrency: 3, // the browser-backed cases share a 4-core machine; more than this starves them
  },
})
