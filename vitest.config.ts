import { defineConfig } from 'vitest/config'

// Fast unit and contract tests. Slower integration and end-to-end tests live in
// tests/integration and tests/e2e and run via `npm run test:integration`.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
  },
})
