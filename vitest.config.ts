import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// `npm test` runs everything except the browser-backed `*.browser.test.ts` files.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    testTimeout: 20_000,
    setupFiles: ['./src/test/setup.ts'],
    include: ['{src,scripts,skills}/**/*.test.{ts,tsx,mjs}'],
    exclude: ['**/node_modules/**', '**/*.browser.test.ts'],
  },
})
