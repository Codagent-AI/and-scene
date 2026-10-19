import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only; see vitest.browser.config.ts for the rest.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
})
