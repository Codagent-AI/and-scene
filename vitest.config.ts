import { defineConfig } from 'vitest/config'

// Every Vitest suite lives under tests/. Browser-backed integration and e2e
// suites added later should sit in their own directories (tests/integration,
// tests/e2e) and may opt into node or longer timeouts per file or project.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    testTimeout: 10_000,
  },
})
