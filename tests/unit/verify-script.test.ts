import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import config from '../../scripts/verify.config.mjs'
import { HOST, PhaseError, urlFor } from '../../scripts/lib/preview.mjs'
import { checkOutline, checkRegistry, createErrorCollector } from '../../scripts/verify.mjs'

const ROOT = path.resolve(__dirname, '../..')
const outline = config.outline!
const good = () => outline.map((o, i) => ({ id: `s${i}`, ...o }))

describe('checkOutline (sample assertions)', () => {
  it('accepts the canonical sample', () => {
    expect(checkOutline(outline, good())).toEqual([])
  })

  it('rejects an absent or empty sample', () => {
    expect(checkOutline(outline, undefined)).not.toEqual([])
    expect(checkOutline(outline, [])).toEqual(['presentation has no steps'])
  })

  it('rejects a wrong step count', () => {
    expect(checkOutline(outline, good().slice(0, 8)).join()).toContain('expected 9 steps, found 8')
    expect(checkOutline(outline, [...good(), { id: 'x', era: 'e', title: 't', caption: 'c' }]).join()).toContain('found 10')
  })

  it('rejects missing or empty fields and duplicate ids', () => {
    const steps = good()
    steps[2] = { ...steps[2], caption: '' }
    delete (steps[3] as Partial<(typeof steps)[0]>).title
    steps[5].id = steps[4].id
    const problems = checkOutline(outline, steps).join('\n')
    expect(problems).toContain('step 2: missing caption')
    expect(problems).toContain('step 3: missing title')
    expect(problems).toContain('step 5: duplicate id')
  })

  it('rejects altered narration and reordered steps, naming the step', () => {
    const altered = good()
    altered[6] = { ...altered[6], title: 'It checks its work' }
    expect(checkOutline(outline, altered).join()).toContain('step 6: title')
    const reordered = good()
    ;[reordered[0], reordered[1]] = [reordered[1], reordered[0]]
    const problems = checkOutline(outline, reordered)
    expect(problems.some((p) => p.startsWith('step 0'))).toBe(true)
    expect(problems.some((p) => p.startsWith('step 1'))).toBe(true)
    const era = good()
    era[8] = { ...era[8], era: 'the end' }
    expect(checkOutline(outline, era).join()).toContain('step 8: era')
  })

  it('checks structure only when there is no outline', () => {
    expect(checkOutline(null, good())).toEqual([])
    expect(checkOutline(null, [{ id: 'a', era: '', title: 't', caption: 'c' }])).toEqual(['step 0: missing era'])
  })
})

describe('checkRegistry', () => {
  const source = readFileSync(path.join(ROOT, 'src/presentations/index.ts'), 'utf8')

  it('accepts the real registry', () => {
    expect(checkRegistry(source, config)).toEqual([])
  })

  it('fails when the sample is missing or retitled', () => {
    expect(checkRegistry(source.replace(config.slug, 'other'), config)[0]).toContain(`no entry with slug "${config.slug}"`)
    expect(checkRegistry(source.replace('How to Use', 'How To Use'), config)[0]).toContain('lacks title')
    expect(checkRegistry('export const presentations = []', config)).not.toEqual([])
  })
})

describe('console and page error handling', () => {
  it('records console errors and uncaught exceptions with the step they happened on', () => {
    const c = createErrorCollector()
    expect(c.first()).toBeUndefined()
    c.onConsole('log', 'fine')
    c.onConsole('warning', 'fine too')
    expect(c.count()).toBe(0)
    c.setStep(3)
    c.onConsole('error', 'boom')
    c.setStep(4)
    c.onPageError('TypeError: x')
    expect(c.count()).toBe(2)
    expect(c.first()).toEqual({ step: 3, message: 'console.error: boom' })
  })

  it('attributes errors before any navigation to the initial render', () => {
    const c = createErrorCollector()
    c.onPageError('early')
    expect(c.first()?.step).toBe('initial')
    expect(c.first()?.message).toContain('uncaught exception')
  })

  it('carries the phase and step on failures', () => {
    const e = new PhaseError('render', 'bad', 4)
    expect([e.phase, e.step, e.message]).toEqual(['render', 4, 'bad'])
  })
})

describe('IPv4 loopback', () => {
  it('builds every URL from 127.0.0.1', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(urlFor(4173)).toBe('http://127.0.0.1:4173/')
    expect(urlFor(4173, '/slug')).toBe('http://127.0.0.1:4173/slug')
  })

  it('never mentions localhost in the verification or inspection scripts', () => {
    for (const file of ['scripts/verify.mjs', 'scripts/lib/preview.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(readFileSync(path.join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''), file).not.toMatch(/localhost|\[::1\]/)
    }
  })
})
