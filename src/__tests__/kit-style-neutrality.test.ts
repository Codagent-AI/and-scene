import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)])
}

it('keeps visual defaults and styling frameworks out of the scene kit', () => {
  const source = files(join(process.cwd(), 'src/presentation-kit')).filter((path) => /\.[jt]sx?$/.test(path)).map((path) => readFileSync(path, 'utf8')).join('\n')
  expect(source).not.toMatch(/tailwind|#[0-9a-f]{3,8}\b|\b(?:font-family|font-size|box-shadow|background-color)\s*:/i)
})
