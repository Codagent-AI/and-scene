import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.mjs'],
    globalSetup: ['tests/integration/global-setup.mjs'],
    testTimeout: 180_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
})
