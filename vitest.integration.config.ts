import { defineConfig } from 'vitest/config'

// Slower, browser- and filesystem-backed tests: bootstrap materialization,
// screenshot helper, and verification failure contracts.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 300_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
