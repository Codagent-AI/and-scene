import { defineConfig } from 'vitest/config'

// Slower integration and end-to-end suites: real installs, builds, subprocesses
// and Chromium. Run with `npm run test:integration`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 600000,
    hookTimeout: 600000,
    // The machine has few cores: run files one after another and cap concurrent cases.
    fileParallelism: false,
    maxConcurrency: 3,
  },
})
