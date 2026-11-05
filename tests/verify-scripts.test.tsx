// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { registeredSlugs } from '../scripts/registry.mjs'
const text = (path: string) => readFileSync(path, 'utf8')
const boot = 'skills/presentation/templates/bootstrap/'
describe('registered presentation discovery', () => {
  it('reads slugs from the explicit index regardless of quoting or formatting', () => {
    expect(registeredSlugs(`export const presentations = [{ slug: 'a-talk', title: 'A', load }, {\n slug: "b", title: 'B', load }]`)).toEqual(['a-talk', 'b'])
  })
  it('finds nothing in an empty registry', () => {
    expect(registeredSlugs('export const presentations: Entry[] = []')).toEqual([])
  })
})
describe('verification scripts', () => {
  it('keeps root and bootstrap scripts byte-aligned', () => {
    for (const file of ['verify.mjs', 'registry.mjs', 'browser-utils.mjs', 'inspect-presentation.mjs']) expect(text(boot + 'scripts/' + file)).toBe(text('scripts/' + file))
  })
  it('requires the canonical sample only in this repository, not in the scaffold', () => {
    expect(JSON.parse(text('package.json')).scripts.verify).toBe('node scripts/verify.mjs --require-sample')
    expect(JSON.parse(text(boot + 'package.json')).scripts.verify).toBe('node scripts/verify.mjs')
  })
  it('tells the skill to use the project-local verification command', () => {
    expect(text('skills/presentation/SKILL.md')).toContain('`npm run verify`')
  })
})
