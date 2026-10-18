import { defineConfig } from 'vitest/config'

// Slower filesystem- and browser-backed integration tests (INT-001, INT-002).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 240_000,
    hookTimeout: 480_000,
  },
})
