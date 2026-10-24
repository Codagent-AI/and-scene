import { defineConfig } from 'vitest/config'

// Slower integration and end-to-end suites (`npm run test:integration`): real filesystem copies,
// subprocesses, production builds, and Chromium.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    testTimeout: 240_000,
    hookTimeout: 480_000,
    fileParallelism: false,
  },
})
