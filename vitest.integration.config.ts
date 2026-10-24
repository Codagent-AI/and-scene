import { defineConfig } from 'vitest/config'

// INT-001 and INT-002: materialized bootstrap and screenshot helper.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 300000,
    hookTimeout: 600000,
    fileParallelism: false,
  },
})
