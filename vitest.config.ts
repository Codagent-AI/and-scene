import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only; integration and browser tests live in
// vitest.integration.config.ts and run through `npm run test:integration`.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
})
