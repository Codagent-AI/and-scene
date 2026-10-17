import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only; browser-backed suites use vitest.integration.config.ts.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/contract/**/*.test.ts'],
    restoreMocks: true,
  },
})
