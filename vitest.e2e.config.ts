import { defineConfig } from 'vitest/config'

// E2E-001 and E2E-002: `npm run verify` against the real app and faulty copies.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
