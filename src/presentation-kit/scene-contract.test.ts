import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

test('provides the reusable scene step contract', () => {
  expect(existsSync(resolve(import.meta.dirname, 'types.ts'))).toBe(true)
})
