import { defineConfig } from 'vitest/config'

// Fast unit, component, and contract tests only (`npm test`).
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
})
