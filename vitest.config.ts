import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'jsdom', globalSetup: ['scripts/prepare-contracts.mjs'], include: ['tests/**/*.test.{ts,tsx}'], setupFiles: ['tests/setup.ts'] } })
