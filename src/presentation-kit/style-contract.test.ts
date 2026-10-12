import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '.')
function filesUnder(directory: string): string[] {
 return readdirSync(directory).flatMap(name => {
  const path = join(directory, name)
  return statSync(path).isDirectory() ? filesUnder(path) : [path]
 })
}

describe('style-neutral kit boundary', () => {
 it('has no stylesheet, visual-style defaults, or framework imports', () => {
  const files = filesUnder(root)
  expect(files.some(path => /\.(css|scss|sass|less)$/.test(path))).toBe(false)
  const source = files.filter(path => /\.(ts|tsx)$/.test(path) && !/\.test\.(ts|tsx)$/.test(path)).map(path => readFileSync(path, 'utf8')).join('\n')
  expect(source).not.toMatch(/\b(?:color|background|font(?:Family|Size|Weight)?|border|boxShadow|textShadow)\s*:/i)
  expect(source).not.toMatch(/\b(?:tailwindcss|@chakra-ui|@mui\/|bootstrap|styled-components|@emotion\/)/i)
 })
})
