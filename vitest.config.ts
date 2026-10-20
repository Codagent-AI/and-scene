import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only; browser-backed and filesystem-heavy suites live in vitest.integration.config.ts.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
  },
})
