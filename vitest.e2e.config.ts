import { defineConfig } from 'vitest/config'

// Browser-backed suites (need Chromium: `npx playwright install chromium`). Run with `npm run test:e2e`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['e2e/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
})
