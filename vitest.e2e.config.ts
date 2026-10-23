import { defineConfig } from 'vitest/config'

// E2E-002: runs `npm run verify` against faulty throwaway copies.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
})
