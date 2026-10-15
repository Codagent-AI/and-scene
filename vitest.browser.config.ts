import { defineConfig } from 'vitest/config'

// Real-browser tests: they copy the project, build it, and drive Playwright Chromium over
// `vite preview` on 127.0.0.1. Requires `npx playwright install chromium`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/browser/**/*.test.ts'],
    testTimeout: 240_000,
    hookTimeout: 240_000,
    fileParallelism: false,
  },
})
