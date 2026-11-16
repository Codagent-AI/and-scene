import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], resolve: { alias: { '../../../presentation-kit': new URL('./src/presentation-kit/index.ts', import.meta.url).pathname } }, test: { environment: 'jsdom', include: ['tests/**/*.test.{ts,tsx}'], setupFiles: ['tests/setup.ts'] } })
