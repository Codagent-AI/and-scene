import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}', 'skills/**/*.test.{ts,tsx}'] },
      },
      {
        extends: true,
        test: { name: 'integration', environment: 'node', include: ['tests/integration/**/*.test.ts'], testTimeout: 300000, hookTimeout: 300000, fileParallelism: false },
      },
      {
        extends: true,
        test: { name: 'e2e', environment: 'node', include: ['tests/e2e/**/*.test.ts'], testTimeout: 300000, hookTimeout: 300000, fileParallelism: false },
      },
    ],
  },
})
