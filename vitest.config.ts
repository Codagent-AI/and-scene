import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Fast unit and contract tests. Integration and end-to-end suites have their own configs.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
})
