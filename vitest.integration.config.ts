import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 240000,
    hookTimeout: 240000,
    fileParallelism: false,
  },
})
