import { defineConfig } from 'vitest/config'

// Browser-backed integration and end-to-end suites (build, preview, Chromium).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
