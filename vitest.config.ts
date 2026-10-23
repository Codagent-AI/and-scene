import { defineConfig } from 'vitest/config'

// Fast unit, component, and contract tests only (`npm test`).
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/unit/setup.ts'],
  },
})
