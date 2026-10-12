import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    testTimeout: 600000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
})
