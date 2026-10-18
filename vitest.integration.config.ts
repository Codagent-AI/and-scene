import { defineConfig } from 'vitest/config'

// Slower filesystem, subprocess, and browser-backed suites (INT-001, INT-002, E2E-001, E2E-002).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.mjs'],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
