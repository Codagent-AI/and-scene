import { defineConfig } from 'vitest/config'

// `npm run test:browser` runs only the Playwright-backed `*.browser.test.ts` files.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['{src,scripts,skills}/**/*.browser.test.ts'],
    exclude: ['**/node_modules/**'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
})
