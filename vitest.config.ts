import { defineConfig } from 'vitest/config'

// `npm test`: fast unit, component and contract tests only.
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['src/test-utils/setup.ts'],
        },
      },
      {
        extends: true,
        test: { name: 'node', environment: 'node', include: ['tests/unit/**/*.test.ts'] },
      },
    ],
  },
})
