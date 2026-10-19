// @vitest-environment node
import { readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  HOST,
  VerifyError,
  checkSampleRegistered,
  compareStep,
  findFreePort,
  formatFailure,
  parseReference,
  parseRegistry,
  selectMode,
  slugsToVisit,
// @ts-expect-error plain ESM helper without type declarations
} from '../../scripts/lib/verify-helpers.mjs'

const scripts = path.resolve(__dirname, '..', '..', 'scripts')
const REGISTRY = `
import type { ComponentType } from 'react'
export const presentations = [
  // { slug: 'commented-out', title: 'No', load: () => import('./no') },
  { slug: 'alpha', title: "Alpha: a // talk", load: () => import('./alpha/Talk') },
  {
    slug: 'beta',
    title: 'Beta',
    load: () => import('./beta/Talk'),
  },
]
`

const reference = () => JSON.parse(readFileSync(path.join(scripts, 'verify.reference.json'), 'utf8'))

describe('registry parsing', () => {
  it('extracts slugs and titles and ignores comments', () => {
    expect(parseRegistry(REGISTRY)).toEqual([
      { slug: 'alpha', title: 'Alpha: a // talk' },
      { slug: 'beta', title: 'Beta' },
    ])
  })
  it('returns nothing for an empty registry', () => {
    expect(parseRegistry('export const presentations = []')).toEqual([])
  })
})

describe('mode selection', () => {
  it('uses reference mode only when the reference file exists', () => {
    expect(selectMode(true)).toBe('reference')
    expect(selectMode(false)).toBe('scaffold-local')
  })
  it('scaffold-local mode fails when nothing is registered', () => {
    expect(() => slugsToVisit([])).toThrow(VerifyError)
    expect(slugsToVisit(parseRegistry(REGISTRY))).toEqual(['alpha', 'beta'])
  })
  it('reference mode fails when the sample is missing from the registry', () => {
    const ref = reference()
    expect(() => checkSampleRegistered(parseRegistry(REGISTRY), ref)).toThrowError(/not registered/)
    expect(() => checkSampleRegistered([], ref)).toThrow(VerifyError)
  })
  it('reference mode accepts the registered sample and rejects a wrong registry title', () => {
    const ref = reference()
    expect(() => checkSampleRegistered([{ slug: ref.slug, title: ref.presentationTitle }], ref)).not.toThrow()
    expect(() => checkSampleRegistered([{ slug: ref.slug, title: 'Other' }], ref)).toThrowError(/registry title/)
  })
})

describe('shipped reference file', () => {
  it('has the nine normative rows in order and validates', () => {
    const ref = parseReference(readFileSync(path.join(scripts, 'verify.reference.json'), 'utf8'))
    expect(ref.stepCount).toBe(9)
    expect(ref.steps.map((s: { title: string }) => s.title)).toEqual([
      'You have a topic',
      'The skill interviews you',
      'Answers become steps',
      'The deck grows',
      'You set the depth',
      'It assembles the scene',
      'It checks its own work',
      'Changed your mind? Loop it.',
      "You're looking at one",
    ])
    expect(ref.steps.map((s: { era: string }) => s.era)).toEqual([
      'the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering', 'the build', 'the build', 'the loop', 'the reveal',
    ])
  })
  it.each([
    ['invalid JSON', '{nope'],
    ['non-object', '3'],
    ['missing slug', JSON.stringify({ presentationTitle: 't', steps: [{ era: 'e', title: 't', caption: 'c' }] })],
    ['empty steps', JSON.stringify({ slug: 's', presentationTitle: 't', steps: [] })],
    ['step missing caption', JSON.stringify({ slug: 's', presentationTitle: 't', steps: [{ era: 'e', title: 't' }] })],
  ])('rejects malformed reference: %s', (_name, text) => {
    expect(() => parseReference(text)).toThrow(VerifyError)
    try {
      parseReference(text)
    } catch (e) {
      expect((e as { phase: string }).phase).toBe('sample-registration')
    }
  })
})

describe('reference comparison', () => {
  const expected = { era: 'the ask', title: 'T', caption: 'C' }
  it('matches identical observations and ignores unobserved fields', () => {
    expect(compareStep(expected, { era: 'the ask', title: 'T', caption: 'C' })).toEqual([])
    expect(compareStep(expected, { title: 'T' })).toEqual([])
  })
  it('reports each differing field', () => {
    const out = compareStep(expected, { era: 'x', title: 'Other', caption: 'C' })
    expect(out).toHaveLength(2)
    expect(out.join(' ')).toContain('title')
    expect(out.join(' ')).toContain('era')
  })
})

describe('failure formatting', () => {
  it('names phase and zero-based step', () => {
    expect(formatFailure(new VerifyError('transition', 'stuck', 3))).toBe('[verify] FAIL phase=transition step=3 stuck')
    expect(formatFailure(new VerifyError('build', 'broke'))).toBe('[verify] FAIL phase=build broke')
  })
})

describe('port finding', () => {
  it('returns a currently bindable port on 127.0.0.1', async () => {
    const port = await findFreePort()
    expect(port).toBeGreaterThan(0)
    await new Promise<void>((resolve, reject) => {
      const s = net.createServer()
      s.once('error', reject)
      s.listen(port, HOST, () => s.close(() => resolve()))
    })
  })
})

describe('verify.mjs address hygiene', () => {
  it.each(['verify.mjs', 'lib/verify-helpers.mjs'])('%s never mentions localhost or ::1', (file) => {
    const text = readFileSync(path.join(scripts, file), 'utf8')
    expect(text).not.toMatch(/localhost/i)
    expect(text).not.toContain('::1')
  })
  it('binds, probes and navigates through the 127.0.0.1 constant', () => {
    const text = readFileSync(path.join(scripts, 'verify.mjs'), 'utf8')
    expect(readFileSync(path.join(scripts, 'lib/verify-helpers.mjs'), 'utf8')).toContain("HOST = '127.0.0.1'")
    expect(text).toMatch(/'--host', HOST/)
    expect(text).toMatch(/const base = `http:\/\/\$\{HOST\}:/)
    expect(text).toMatch(/probe\(`\$\{base\}\//)
    expect(text).toMatch(/const url = `\$\{base\}\//)
  })
})
