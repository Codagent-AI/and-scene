import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 300000,
    reporters: ['verbose'],
  },
})
