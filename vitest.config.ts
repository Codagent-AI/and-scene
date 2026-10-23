import { defineConfig } from 'vitest/config'

// Fast unit, component and contract tests only. Browser-backed and
// materialization tests live in tests/integration and tests/e2e.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/unit/setup.ts'],
  },
})
