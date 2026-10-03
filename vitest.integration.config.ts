import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/**/*.test.ts'],
    testTimeout: 180_000,
    hookTimeout: 180_000,
    // Each file here spawns real npm builds, preview servers, and Chromium
    // instances; running files in parallel starves them of CPU and produces
    // spurious timeouts, so keep files sequential instead.
    fileParallelism: false,
  },
})
