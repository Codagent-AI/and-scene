import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    // Filesystem installation plus several production browser subprocesses.
    testTimeout: 600000,
    reporters: ['verbose'],
  },
})
