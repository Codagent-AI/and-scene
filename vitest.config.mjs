import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only (npm test).
export default defineConfig({
  test: { include: ['tests/unit/**/*.test.{ts,tsx,mjs}'], testTimeout: 15000 },
})
