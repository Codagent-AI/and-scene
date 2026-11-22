import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['tests/integration/**/*.test.mjs'], environment: 'node', testTimeout: 240000, hookTimeout: 240000, fileParallelism: false } })
