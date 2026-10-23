import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Integration and end-to-end suites: real filesystem copies, subprocesses, and Chromium.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/integration/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
})
