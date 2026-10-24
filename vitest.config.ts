import { defineConfig } from 'vitest/config'

// `npm test`: fast unit and contract tests only.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
    restoreMocks: true,
    testTimeout: 20000, // first-time transforms of the sample bundle can be slow on a busy machine
    setupFiles: ['tests/support/setup.ts'],
  },
})
