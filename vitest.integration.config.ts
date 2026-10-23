import { defineConfig } from 'vitest/config'

// Slower integration and end-to-end suites: real installs, builds, subprocesses
// and Chromium. Run with `npm run test:integration`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 600000,
    hookTimeout: 600000,
    fileParallelism: true,
  },
})
