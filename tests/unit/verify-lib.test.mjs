import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkSample, compareSteps, createErrorCollector } from '../../scripts/verify.mjs'
import { HOST, parseRegistrySlugs } from '../../scripts/lib.mjs'

const root = path.resolve(import.meta.dirname, '../..')
const reference = JSON.parse(readFileSync(path.join(root, 'scripts/reference-sample.json'), 'utf8'))

describe('compareSteps', () => {
  it('accepts the normative table and rejects missing, reordered and malformed steps', () => {
    expect(compareSteps(reference.steps, reference.steps)).toEqual([])
    expect(compareSteps(reference.steps.slice(0, 8), reference.steps)).toEqual(
      expect.arrayContaining([expect.stringContaining('expected 9 steps but found 8')]),
    )
    const swapped = [...reference.steps]
    ;[swapped[1], swapped[2]] = [swapped[2], swapped[1]]
    expect(compareSteps(swapped, reference.steps).join('\n')).toMatch(/step 2 title/)
    const edited = reference.steps.map((s, i) => (i === 4 ? { ...s, caption: 'Different.' } : s))
    expect(compareSteps(edited, reference.steps).join('\n')).toMatch(/step 5 caption/)
    expect(compareSteps([...reference.steps, reference.steps[0]], reference.steps)[0]).toMatch(/found 10/)
  })
})

describe('checkSample', () => {
  const project = (slug, meta) => {
    const dir = mkdtempSync(path.join(tmpdir(), 'verify-sample-'))
    mkdirSync(path.join(dir, 'scripts'))
    mkdirSync(path.join(dir, 'src/presentations', slug), { recursive: true })
    writeFileSync(path.join(dir, 'scripts/reference-sample.json'), JSON.stringify(reference))
    writeFileSync(path.join(dir, 'src/presentations/index.ts'), `export const presentations = [{ slug: '${slug}' }]\n`)
    if (meta) writeFileSync(path.join(dir, 'src/presentations', slug, 'meta.ts'), meta)
    return dir
  }
  const metaOf = (steps) => `export const STEP_META = ${JSON.stringify(steps)}\n`

  it('passes for the real repository sample', async () => {
    expect(await checkSample(root)).toEqual([])
  })

  it('passes when the sample matches and is registered', async () => {
    expect(await checkSample(project(reference.slug, metaOf(reference.steps)))).toEqual([])
  })

  it('fails when the sample is unregistered, has no metadata, or is out of order', async () => {
    const dir = project(reference.slug, metaOf(reference.steps))
    writeFileSync(path.join(dir, 'src/presentations/index.ts'), 'export const presentations = []\n')
    expect((await checkSample(dir))[0]).toMatch(/not registered/)
    expect((await checkSample(project(reference.slug, null)))[0]).toMatch(/no src\/presentations/)
    const reordered = [...reference.steps].reverse()
    expect((await checkSample(project(reference.slug, metaOf(reordered)))).length).toBeGreaterThan(0)
    expect((await checkSample(project(reference.slug, 'throw new Error("bad")')))[0]).toMatch(/could not be loaded/)
  })

  it('does nothing when no reference sample is configured', async () => {
    expect(await checkSample(mkdtempSync(path.join(tmpdir(), 'verify-empty-')))).toEqual([])
  })
})

describe('createErrorCollector', () => {
  it('records console.error and pageerror events with the step they happened on', () => {
    const page = new EventEmitter()
    const collector = createErrorCollector()
    collector.attach(page)
    page.emit('console', { type: () => 'log', text: () => 'fine' })
    collector.setStep(0)
    page.emit('console', { type: () => 'error', text: () => 'first' })
    collector.setStep(5)
    page.emit('pageerror', new Error('boom'))
    page.emit('console', { type: () => 'error', text: () => 'late' })
    expect(collector.errors).toEqual([
      { step: 0, message: 'console.error: first' },
      { step: 5, message: 'uncaught page error: boom' },
      { step: 5, message: 'console.error: late' },
    ])
  })
})

describe('loopback and registry parsing', () => {
  it('uses the 127.0.0.1 host everywhere and never localhost', () => {
    expect(HOST).toBe('127.0.0.1')
    for (const file of ['lib.mjs', 'verify.mjs', 'inspect-presentation.mjs']) {
      const src = readFileSync(path.join(root, 'scripts', file), 'utf8')
      expect(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')).not.toMatch(/localhost/i)
    }
    const lib = readFileSync(path.join(root, 'scripts/lib.mjs'), 'utf8')
    expect(lib).toMatch(/'--host', HOST/)
    expect(lib).toMatch(/http:\/\/\$\{HOST\}:\$\{port\}/)
    expect(lib).toMatch(/listen\(0, HOST/)
  })

  it('reads slugs from the explicit registry in order', () => {
    expect(parseRegistrySlugs("[{ slug: 'a', title: 'x' }, { slug: \"b-c\" }]")).toEqual(['a', 'b-c'])
  })

  it('attaches error listeners before navigating and cleans up the preview on every exit', () => {
    const verify = readFileSync(path.join(root, 'scripts/verify.mjs'), 'utf8')
    expect(verify.indexOf('collector.attach(page)')).toBeLessThan(verify.indexOf('await verifyRoute(page'))
    const lib = readFileSync(path.join(root, 'scripts/lib.mjs'), 'utf8')
    expect(lib).toMatch(/finally \{[\s\S]*await preview\.stop\(\)/)
    expect(lib).toMatch(/process\.once\('SIGINT'/)
    expect(lib).toMatch(/process\.once\('SIGTERM'/)
  })
})
