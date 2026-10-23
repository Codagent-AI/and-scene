import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Fast unit, component and contract tests only. Browser-backed suites use
// vitest.integration.config.ts.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/unit/setup.ts'],
    restoreMocks: true,
  },
})
