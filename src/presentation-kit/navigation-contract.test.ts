import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

test('exports clamped navigation for the presentation chrome', () => {
  const source = readFileSync(resolve(import.meta.dirname, 'usePresentationNav.ts'), 'utf8')
  expect(source).toContain('export function clampStepIndex')
})
