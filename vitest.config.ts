import { defineConfig } from 'vitest/config'

// Fast unit, component and contract tests only. Browser-backed tests live in tests/browser.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}', 'tests/unit/**/*.test.{ts,mjs}'],
  },
})
