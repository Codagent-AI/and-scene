// @vitest-environment node
import { test, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
test('I-3 typed payload boundary compiles positive and rejects negative fixtures', () => {
  const result = spawnSync('node_modules/.bin/tsc', ['--ignoreConfig','--noEmit','--strict','--skipLibCheck','--jsx','react-jsx','--target','es2023','--module','esnext','--moduleResolution','bundler','--allowSyntheticDefaultImports','tests/types.tsx'], { encoding: 'utf8', timeout: 120000 })
  expect(result.status, result.stdout + result.stderr).toBe(0)
})
