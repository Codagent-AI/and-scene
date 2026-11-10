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
