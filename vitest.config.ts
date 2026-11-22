import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], test: { include: ['tests/unit/**/*.test.{ts,tsx}'], environment: 'jsdom', setupFiles: ['tests/setup.ts'] } })
