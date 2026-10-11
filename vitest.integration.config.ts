import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['tests/e2e/**/*.test.ts', 'tests/integration/**/*.test.ts'], testTimeout: 60000, hookTimeout: 60000, fileParallelism: false } });
