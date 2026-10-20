import { defineConfig } from 'vitest/config'

// INT-001 and INT-002: slow, browser- and filesystem-backed.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    testTimeout: 300000,
    hookTimeout: 600000,
    fileParallelism: false,
  },
})
