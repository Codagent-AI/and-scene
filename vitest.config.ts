import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Fast unit and contract tests only. Browser- and subprocess-backed suites have their own configs.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.mjs'],
    setupFiles: ['src/test-setup.ts'],
    // jsdom walks of a nine-step presentation take seconds on a busy machine.
    testTimeout: 20_000,
  },
})
