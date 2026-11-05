import { defineConfig } from 'vitest/config'
export default defineConfig({test:{include:['tests/**/*.integration.test.ts'], fileParallelism: false, testTimeout: 300000, hookTimeout: 300000}})
