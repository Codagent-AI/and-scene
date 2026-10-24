import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { checkRenderedStep, checkSampleRegistration, findRegistryEntry } from '../../scripts/lib/outline.mjs'
import { readJson } from '../support/files.ts'

const config = readJson('verify.config.json')
const REGISTRY = `
export const presentations = [
  { slug: 'other', title: 'Other', load: () => import('./other/Talk.tsx') },
  {
    slug: '${config.slug}',
    title: '${config.title}',
    load: () => import('./sample/Talk.tsx'),
  },
]
`
const dirs: string[] = []
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

function project(registry: string | null, files: string[] = ['sample/Talk.tsx']) {
  const root = mkdtempSync(path.join(tmpdir(), 'outline-'))
  dirs.push(root)
  const pres = path.join(root, 'src', 'presentations')
  mkdirSync(pres, { recursive: true })
  if (registry !== null) writeFileSync(path.join(pres, 'index.ts'), registry)
  for (const f of files) {
    mkdirSync(path.dirname(path.join(pres, f)), { recursive: true })
    writeFileSync(path.join(pres, f), 'export default () => null')
  }
  return root
}

describe('the verification config (M-59)', () => {
  it('lists nine eras, titles and captions', () => {
    expect(config.steps).toHaveLength(9)
    expect(config.steps.every((s: Record<string, string>) => s.era && s.title && s.caption)).toBe(true)
  })
})

describe('findRegistryEntry', () => {
  it('finds the entry for a slug and reads its title and loader', () => {
    expect(findRegistryEntry(REGISTRY, config.slug)).toEqual({ title: config.title, loadPath: './sample/Talk.tsx' })
    expect(findRegistryEntry(REGISTRY, 'other')).toEqual({ title: 'Other', loadPath: './other/Talk.tsx' })
    expect(findRegistryEntry(REGISTRY, 'nope')).toBeNull()
  })
})

describe('registration checks reject missing or malformed samples (M-62)', () => {
  it('accepts a correct registration', () => {
    expect(checkSampleRegistration(project(REGISTRY), config)).toEqual([])
  })

  it('rejects a missing registry file', () => {
    expect(checkSampleRegistration(project(null), config)[0]).toMatch(/registry .* is missing/)
  })

  it('rejects an unregistered sample', () => {
    const registry = REGISTRY.replace(`slug: '${config.slug}'`, "slug: 'renamed'")
    expect(checkSampleRegistration(project(registry), config)[0]).toMatch(/not registered/)
  })

  it('rejects a wrong title', () => {
    const registry = REGISTRY.replace(config.title, 'A Different Title')
    expect(checkSampleRegistration(project(registry), config)[0]).toMatch(/sample title is "A Different Title"/)
  })

  it('rejects a registered sample whose source is missing', () => {
    expect(checkSampleRegistration(project(REGISTRY, []), config)[0]).toMatch(/does not exist/)
  })

  it('rejects an entry with no loader', () => {
    const registry = `export const presentations = [{ slug: '${config.slug}', title: '${config.title}' }]`
    expect(checkSampleRegistration(project(registry), config)[0]).toMatch(/no import\(\) loader/)
  })
})

describe('rendered step comparison (M-59, M-62)', () => {
  const expected = config.steps[2]
  it('passes identical values and names every differing field', () => {
    expect(checkRenderedStep(expected, { ...expected })).toEqual([])
    const problems = checkRenderedStep(expected, { era: 'wrong', title: expected.title, caption: `${expected.caption}!` })
    expect(problems).toHaveLength(2)
    expect(problems[0]).toMatch(/^era is "wrong"/)
    expect(problems[1]).toMatch(/^caption is/)
    expect(checkRenderedStep(expected, { era: undefined, title: undefined, caption: undefined })).toHaveLength(3)
  })

  it('compares punctuation exactly', () => {
    const row = config.steps[7]
    expect(checkRenderedStep(row, { ...row, title: row.title.replace('?', '') })).toHaveLength(1)
  })
})
