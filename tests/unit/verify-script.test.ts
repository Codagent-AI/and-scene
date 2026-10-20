// @vitest-environment node
import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOST, registryEntry, registrySlugs } from '../../scripts/lib/common.mjs'
import { checkRegistry, checkTransition, collectBrowserErrors, compareStep, loadConfig, renderSteps, VerifyError } from '../../scripts/verify.mjs'

const root = path.resolve(import.meta.dirname, '..', '..')

function projectWithRegistry(source: string) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'verify-unit-'))
  mkdirSync(path.join(dir, 'src', 'presentations'), { recursive: true })
  writeFileSync(path.join(dir, 'src', 'presentations', 'index.ts'), source)
  return dir
}

describe('registry checks', () => {
  const registry = `export const PRESENTATIONS = [
    { slug: 'one', title: 'One', load: () => import('./one/Talk') },
    { slug: 'two', title: 'Two', load: () => import('./two/Talk') },
  ]`

  it('reads slugs and loader targets from the explicit registry', () => {
    const dir = projectWithRegistry(registry)
    expect(registrySlugs(dir)).toEqual(['one', 'two'])
    expect(registryEntry('two', dir)).toEqual({ slug: 'two', loadPath: './two/Talk' })
    expect(registryEntry('three', dir)).toBeNull()
  })

  it('fails the sample phase when the reference sample is not registered', () => {
    const dir = projectWithRegistry(registry)
    expect(() => checkRegistry({ slug: 'how-to-make-a-presentation', steps: [] }, dir)).toThrowError(VerifyError)
    try {
      checkRegistry({ slug: 'missing', steps: [] }, dir)
    } catch (error) {
      expect((error as VerifyError).phase).toBe('sample')
      expect((error as Error).message).toContain('"missing"')
    }
  })

  it('fails the sample phase when the loader points at a module that does not exist', () => {
    const dir = projectWithRegistry(registry)
    mkdirSync(path.join(dir, 'src', 'presentations', 'one'))
    writeFileSync(path.join(dir, 'src', 'presentations', 'one', 'Talk.tsx'), '')
    expect(checkRegistry({ slug: 'one', steps: [] }, dir).loadPath).toBe('./one/Talk')
    expect(() => checkRegistry({ slug: 'two', steps: [] }, dir)).toThrowError(/loader points at \.\/two\/Talk/)
  })

  it('finds the committed sample in the real registry and config', () => {
    const config = loadConfig(root)
    expect(config.slug).toBe('how-to-make-a-presentation')
    expect(config.steps).toHaveLength(9)
    expect(checkRegistry(config, root).loadPath).toContain('how-to-make-a-presentation')
  })
})

describe('step comparison', () => {
  const expected = { era: 'e', title: 't', caption: 'c' }

  it('accepts a matching step', () => {
    expect(compareStep(expected, { ...expected })).toBeNull()
  })

  it('reports each differing field independently', () => {
    expect(compareStep(expected, { ...expected, era: 'x' })).toContain('era')
    expect(compareStep(expected, { ...expected, title: 'x' })).toContain('title')
    expect(compareStep(expected, { ...expected, caption: 'x' })).toContain('caption')
    expect(compareStep(expected, { era: null, title: null, caption: null })).toContain('null')
  })
})

describe('transition checks', () => {
  it('passes only when the observed index equals the expected next index', () => {
    expect(checkTransition(2, 3, 3)).toBeNull()
    expect(checkTransition(2, 3, 2)).toContain('did not advance')
    expect(checkTransition(2, 3, 4)).toContain('observed index 4')
    expect(checkTransition(2, 3, null)).toContain('observed index null')
    expect(checkTransition(2, 3, 2)).toContain('step 2')
  })
})

describe('browser error collection', () => {
  const fakePage = () => Object.assign(new EventEmitter(), {}) as unknown as Parameters<typeof collectBrowserErrors>[0] & EventEmitter

  it('records console.error messages but not other console output', () => {
    const page = fakePage()
    const errors = collectBrowserErrors(page)
    page.emit('console', { type: () => 'log', text: () => 'fine' })
    page.emit('console', { type: () => 'warning', text: () => 'warn' })
    page.emit('console', { type: () => 'error', text: () => 'boom' })
    expect(errors).toEqual(['console.error: boom'])
  })

  it('records uncaught page errors independently', () => {
    const page = fakePage()
    const errors = collectBrowserErrors(page)
    page.emit('pageerror', new Error('kaput'))
    expect(errors).toEqual(['uncaught page error: kaput'])
  })
})

describe('IPv4 loopback', () => {
  it('uses 127.0.0.1 everywhere and never builds a localhost URL', () => {
    expect(HOST).toBe('127.0.0.1')
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/common.mjs']) {
      const source = readFileSync(path.join(root, file), 'utf8')
      expect(source, file).not.toMatch(/localhost|::1/)
    }
    expect(readFileSync(path.join(root, 'scripts/lib/common.mjs'), 'utf8')).toMatch(/'--host', HOST/)
  })
})

describe('rendering the sample', () => {
  /** A page whose public hooks report the given step count and never get past it. */
  const fakePage = (count: number | null) =>
    Object.assign(new EventEmitter(), {
      goto: async () => {},
      waitForSelector: async () => {
        if (count === null) throw new Error('timeout')
      },
      getAttribute: async () => String(count),
    })

  const config = { slug: 's', steps: [{ era: 'e', title: 't', caption: 'c' }] }

  it('fails the sample phase when the presentation reports a different number of steps', async () => {
    const rejected = renderSteps(fakePage(8), 'http://127.0.0.1:1', { ...config, steps: Array(9).fill(config.steps[0]) }, [])
    await expect(rejected).rejects.toMatchObject({ phase: 'sample', message: expect.stringContaining('expected 9 steps, the presentation reports 8') })
  })

  it('attributes a failure before the first step mounts its hooks to step 1', async () => {
    const rejected = renderSteps(fakePage(null), 'http://127.0.0.1:1', config, ['uncaught page error: kaput'])
    await expect(rejected).rejects.toMatchObject({ phase: 'render', message: expect.stringMatching(/^step 1 \(index 0\): .*kaput/) })
  })
})
