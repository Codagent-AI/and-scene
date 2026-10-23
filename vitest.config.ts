import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Fast unit and contract tests. Browser-backed and process-level suites live in vitest.slow.config.ts.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
