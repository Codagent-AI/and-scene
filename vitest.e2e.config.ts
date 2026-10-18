import { defineConfig } from 'vitest/config'

// End-to-end tests of `npm run verify` (E2E-001, E2E-002).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
})
