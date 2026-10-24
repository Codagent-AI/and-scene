import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.test.mjs'],
    testTimeout: 240_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
})
