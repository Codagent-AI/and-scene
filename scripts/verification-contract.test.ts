import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '..')

test('ships project-local production verification and inspection commands', () => {
  const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { scripts: Record<string, string> }

  expect(packageJson.scripts.verify).toBe('node scripts/verify.mjs')
  expect(packageJson.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  expect(existsSync(resolve(root, 'scripts', 'verify.mjs'))).toBe(true)
  expect(existsSync(resolve(root, 'scripts', 'inspect-presentation.mjs'))).toBe(true)
})
