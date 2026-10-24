import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Fast unit and contract tests (`npm test`).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
})
