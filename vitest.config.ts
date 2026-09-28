import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // The integration/E2E suites spawn their own heavy `npm run build` /
    // Playwright subprocesses; running test files in parallel lets that CPU
    // contention starve unrelated jsdom tests' default timers. Sequential
    // files trade suite wall-clock time for deterministic results.
    fileParallelism: false,
    testTimeout: 15_000,
  },
})
