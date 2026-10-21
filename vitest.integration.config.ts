import { defineConfig } from 'vitest/config'

// Slower tests that materialize projects, install dependencies, and drive Chromium.
const kind = process.env.SCENE_SLOW_SUITE === 'e2e' ? 'e2e' : 'integration'

export default defineConfig({
  test: {
    environment: 'node',
    include: [`tests/${kind}/**/*.test.ts`],
    testTimeout: 600_000,
    hookTimeout: 600_000,
    fileParallelism: false,
  },
})
