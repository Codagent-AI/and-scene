import { defineConfig } from 'vitest/config'

// E2E-001 and E2E-002: `npm run verify` against the repository and throwaway copies.
export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 300000,
    hookTimeout: 300000,
    fileParallelism: false,
  },
})
