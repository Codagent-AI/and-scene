// @vitest-environment node
import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOST, registryEntry, registrySlugs } from '../../scripts/lib/common.mjs'
import { checkRegistry, checkTransition, collectBrowserErrors, compareStep, loadConfig, VerifyError } from '../../scripts/verify.mjs'

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
    expect(checkRegistry({ slug: 'one', steps: [] }, dir).loadPath).toBe('./one/Talk')
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
