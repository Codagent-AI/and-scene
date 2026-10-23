import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 300_000,
    hookTimeout: 600_000,
  },
})
