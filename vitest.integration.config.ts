import { defineConfig } from 'vitest/config'

// Slower integration and browser-backed end-to-end tests (production builds, Chromium).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 240_000,
    hookTimeout: 480_000,
    fileParallelism: false,
  },
})
