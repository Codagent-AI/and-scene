import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

test('provides an explicit registry and landing router', () => {
  expect(existsSync(resolve(import.meta.dirname, 'Landing.tsx'))).toBe(true)
  expect(existsSync(resolve(import.meta.dirname, 'presentations/index.ts'))).toBe(true)
})
