import { defineConfig } from 'vitest/config'

// `npm test`: fast unit and contract tests only.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
    restoreMocks: true,
  },
})
