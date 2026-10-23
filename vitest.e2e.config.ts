import { defineConfig } from 'vitest/config'

// E2E-002: `npm run verify` against throwaway faulty copies of the repository.
export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
