import { defineConfig } from 'vitest/config'

// Slow, browser- and filesystem-backed suites; each project is its own npm script.
const shared = { environment: 'node', fileParallelism: false, testTimeout: 600_000, hookTimeout: 600_000 }

export default defineConfig({
  test: {
    projects: [
      { test: { ...shared, name: 'integration', include: ['tests/integration/**/*.test.mjs'] } },
      { test: { ...shared, name: 'e2e', include: ['tests/e2e/**/*.test.mjs'] } },
    ],
  },
})
