/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: false,
    // Several integration/E2E tests each spawn a real `npm install`,
    // `vite preview` server, and/or Chromium instance. Running test files in
    // parallel makes those compete for CPU/network/ports and causes
    // spurious timeouts, so files run sequentially instead.
    fileParallelism: false,
  },
})
