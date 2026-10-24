import { defineConfig } from 'vitest/config'

// Browser- and filesystem-backed tests; each file shares its expensive setup
// (builds, preview servers, browsers) across its cases.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
