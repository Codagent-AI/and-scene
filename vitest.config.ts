import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only. Browser-backed tests use vitest.integration.config.ts.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs', 'skills/**/*.test.mjs'],
  },
})
