import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only (`npm test`). Slow suites: vitest.integration.config.ts.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{mjs,ts}'],
    restoreMocks: true,
  },
})
