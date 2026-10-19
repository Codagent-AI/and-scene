import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { include: ['tests/integration/**/*.test.ts'], testTimeout: 300000, hookTimeout: 300000, fileParallelism: false },
})
