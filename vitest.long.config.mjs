import { defineConfig } from 'vitest/config'

// Slow, browser-backed integration and end-to-end suites (npm run test:integration / test:e2e).
export default defineConfig({
  test: {
    include: ['tests/{integration,e2e}/**/*.test.mjs'],
    testTimeout: 600000,
    hookTimeout: 600000,
    fileParallelism: false,
  },
})
