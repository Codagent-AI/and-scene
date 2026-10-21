import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Fast unit, component and contract tests. Browser-backed suites live in
// their own directory and run through `npm run test:integration`.
export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./tests/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'scripts/**/*.test.{ts,mjs}',
            'skills/**/*.test.{ts,mjs}',
            'tests/contract/**/*.test.ts',
          ],
          exclude: ['**/node_modules/**', 'skills/presentation/templates/**'],
        },
      },
    ],
  },
})
