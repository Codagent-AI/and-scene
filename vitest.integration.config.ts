import { defineConfig } from 'vitest/config'

// Browser-backed and subprocess-heavy suites: `npm run test:integration`.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.mjs'],
    testTimeout: 240_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
