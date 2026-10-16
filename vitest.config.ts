import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/contract/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
})
