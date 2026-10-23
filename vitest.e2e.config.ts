import { defineConfig } from 'vitest/config'

// End-to-end tests run the verification gate against the repository or throwaway copies.
export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 600_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
})
