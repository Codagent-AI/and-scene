import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only; browser-backed suites have their own configs.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['tests/unit/setup.ts'],
  },
})
