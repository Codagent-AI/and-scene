import { defineConfig } from 'vitest/config'

// Filesystem/subprocess/browser-backed integration tests (`npm run test:integration`).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
