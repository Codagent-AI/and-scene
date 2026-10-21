import { defineConfig } from 'vitest/config'

// Slower integration and end-to-end suites: production builds, a preview server
// and Chromium. Files run one at a time and share their expensive setup.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 300000,
    hookTimeout: 600000,
  },
})
