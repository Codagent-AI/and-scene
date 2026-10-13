import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // These suites build isolated projects and launch Chromium; running them
    // alongside one another can starve the browser and exceed test timeouts.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
  },
})
