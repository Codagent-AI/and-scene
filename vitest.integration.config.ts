import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', include: ['tests/*.integration.test.ts'], testTimeout: 180000, hookTimeout: 180000, fileParallelism: false } })
