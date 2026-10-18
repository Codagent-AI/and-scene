import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only (`npm test`). No browsers, builds, or installs.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/support/setup.ts'],
  },
})
