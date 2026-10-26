import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Composition tests read a presentation's own stylesheet with `?raw` to
    // check scene geometry the DOM cannot express in jsdom. Vitest stubs CSS
    // modules out by default, which would hand those imports an empty string.
    css: true,
    setupFiles: ['./vitest.setup.ts'],
    globals: false,
  },
})
