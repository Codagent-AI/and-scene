import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'
function files(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(root, entry.name)).map(path => join(entry.name, path)) : [entry.name])
}
test('bootstrap scene kit is byte-aligned with canonical kit', () => {
  const canonical = 'src/presentation-kit'
  const template = 'skills/presentation/templates/bootstrap/src/presentation-kit'
  expect(files(template)).toEqual(files(canonical))
  for (const file of files(canonical)) expect(readFileSync(join(template, file))).toEqual(readFileSync(join(canonical, file)))
})
test('bootstrap browser scripts stay byte-aligned', () => {
  for (const file of files('scripts')) expect(readFileSync(join('skills/presentation/templates/bootstrap/scripts', file))).toEqual(readFileSync(join('scripts', file)))
})
test('bootstrap route contract stays byte-aligned', () => {
  expect(readFileSync('skills/presentation/templates/bootstrap/src/presentation-route.mjs')).toEqual(readFileSync('src/presentation-route.mjs'))
})
