import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  VerifyError, collectBrowserErrors, formatFailure, validateRegistry, validateSampleStep, validateStepCount, waitForIndex,
} from '../../scripts/lib/checks.mjs'
import { SAMPLE_OUTLINE, SAMPLE_SLUG, SAMPLE_TITLE } from '../../scripts/lib/outline.mjs'
import { loaderExists, parseRegistry, readRegistry } from '../../scripts/lib/registry.mjs'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'

const failure = async (fn: () => unknown) => {
  try {
    await fn()
  } catch (e) {
    return e as InstanceType<typeof VerifyError>
  }
  throw new Error('expected a failure')
}

const entry = { slug: SAMPLE_SLUG, title: SAMPLE_TITLE, loader: './x/Talk' }
const rendered = (i: number) => ({
  title: SAMPLE_OUTLINE[i].title,
  caption: SAMPLE_OUTLINE[i].caption,
  presentTitle: SAMPLE_OUTLINE[i].title,
})

describe('registry parsing', () => {
  it('reads entries with either quote style, apostrophes in titles and multi-line layout', () => {
    const src = `export const presentations = [
      { slug: 'a', title: "It's a deck", load: () => import('./a/Talk') },
      {
        slug: "b",
        title: 'B',
        load: () => import("./b/Talk"),
      },
    ]`
    expect(parseRegistry(src)).toEqual([
      { slug: 'a', title: "It's a deck", loader: './a/Talk' },
      { slug: 'b', title: 'B', loader: './b/Talk' },
    ])
  })

  it('finds loaders on disk and reads the project registry', () => {
    const root = mkdtempSync(join(tmpdir(), 'reg-'))
    mkdirSync(join(root, 'src', 'presentations', 'a'), { recursive: true })
    writeFileSync(join(root, 'src', 'presentations', 'a', 'Talk.tsx'), '')
    writeFileSync(join(root, 'src', 'presentations', 'index.ts'), "x = [{ slug: 'a', title: 'A', load: () => import('./a/Talk') }]")
    expect(readRegistry(root)).toHaveLength(1)
    expect(loaderExists(root, './a/Talk')).toBe(true)
    expect(loaderExists(root, './b/Talk')).toBe(false)
    expect(readRegistry(join(root, 'nowhere'))).toEqual([])
  })
})

describe('sample phase', () => {
  it('accepts the registered sample', () => {
    expect(validateRegistry([entry], { slug: SAMPLE_SLUG, title: SAMPLE_TITLE })).toBe(entry)
  })

  it.each([
    ['absent', [], /not registered/],
    ['unregistered under another slug', [{ ...entry, slug: 'other' }], /not registered/],
    ['wrong title', [{ ...entry, title: 'Different' }], /does not match/],
  ])('fails in the sample phase when the sample is %s', async (_, entries, message) => {
    const err = await failure(() => validateRegistry(entries, { slug: SAMPLE_SLUG, title: SAMPLE_TITLE }))
    expect(err).toBeInstanceOf(VerifyError)
    expect(err.phase).toBe('sample')
    expect(err.message).toMatch(message)
  })

  it('fails when the loader does not resolve', async () => {
    const err = await failure(() => validateRegistry([entry], { slug: SAMPLE_SLUG, title: SAMPLE_TITLE }, () => false))
    expect([err.phase, err.message]).toEqual(['sample', expect.stringContaining('does not resolve')])
  })

  it('accepts all nine steps in order and rejects a different count', async () => {
    SAMPLE_OUTLINE.forEach((_, i) => validateSampleStep(i, rendered(i), SAMPLE_OUTLINE))
    validateStepCount(9, SAMPLE_OUTLINE)
    for (const n of [0, 8, 10]) expect((await failure(() => validateStepCount(n, SAMPLE_OUTLINE))).phase).toBe('sample')
  })

  it.each(['title', 'caption', 'presentTitle'] as const)('rejects a changed %s and names the step', async (field) => {
    const bad = { ...rendered(3), [field]: 'changed' }
    const err = await failure(() => validateSampleStep(3, bad, SAMPLE_OUTLINE))
    expect([err.phase, err.step]).toEqual(['sample', 3])
    expect(err.message).toContain(field)
  })

  it('rejects out-of-order steps and steps beyond the outline', async () => {
    expect((await failure(() => validateSampleStep(1, rendered(2), SAMPLE_OUTLINE))).step).toBe(1)
    expect((await failure(() => validateSampleStep(9, rendered(8), SAMPLE_OUTLINE))).phase).toBe('sample')
  })

  it('keeps the verifier outline identical to the sample the app ships', () => {
    expect(SAMPLE_OUTLINE).toEqual(STEPS.map(({ era, title, caption }) => ({ era, title, caption })))
  })
})

describe('render phase: transitions', () => {
  const sequence = (values: (number | null)[]) => {
    let i = 0
    return async () => values[Math.min(i++, values.length - 1)]
  }

  it('succeeds once the index becomes the expected one', async () => {
    await waitForIndex(sequence([2, 2, 3]), 3, { from: 2, pollMs: 1, timeoutMs: 500 })
  })

  it('times out naming the step when the index never advances', async () => {
    const err = await failure(() => waitForIndex(sequence([2]), 3, { from: 2, pollMs: 1, timeoutMs: 40 }))
    expect([err.phase, err.step]).toEqual(['render', 3])
    expect(err.message).toMatch(/stayed 2.*expected 3/)
  })

  it('surfaces a recorded browser error ahead of a generic timeout', async () => {
    const check = () => {
      throw new VerifyError('render', 'console.error: crash', 5)
    }
    const err = await failure(() => waitForIndex(sequence([null]), 6, { from: 5, pollMs: 1, timeoutMs: 5000, check }))
    expect([err.step, err.message]).toEqual([5, 'console.error: crash'])
  })

  it('fails immediately when the index jumps to the wrong step', async () => {
    const err = await failure(() => waitForIndex(sequence([2, 5]), 3, { from: 2, pollMs: 1, timeoutMs: 5000 }))
    expect(err.message).toMatch(/became 5, expected 3/)
  })
})

describe('render phase: browser errors', () => {
  const fakePage = () => Object.assign(new EventEmitter(), {}) as EventEmitter & { on: EventEmitter['on'] }
  const consoleMsg = (type: string, text: string) => ({ type: () => type, text: () => text })

  it('passes with no errors and ignores non-error console output', () => {
    const page = fakePage()
    const c = collectBrowserErrors(page, () => 0)
    page.emit('console', consoleMsg('log', 'hello'))
    page.emit('console', consoleMsg('warning', 'careful'))
    expect(() => c.check()).not.toThrow()
  })

  it.each([0, 4, 8])('reports a console.error at step %i', async (step) => {
    const page = fakePage()
    const c = collectBrowserErrors(page, () => step)
    page.emit('console', consoleMsg('error', 'boom'))
    const err = await failure(() => c.check())
    expect([err.phase, err.step]).toEqual(['render', step])
    expect(err.message).toBe('console.error: boom')
  })

  it('reports uncaught page errors separately and keeps the first failing step', async () => {
    const page = fakePage()
    let step = 2
    const c = collectBrowserErrors(page, () => step)
    page.emit('pageerror', new Error('uncaught!'))
    step = 3
    page.emit('console', consoleMsg('error', 'later'))
    const err = await failure(() => c.check())
    expect([err.step, err.message]).toEqual([2, 'uncaught page error: uncaught!'])
    expect(c.errors).toHaveLength(2)
  })
})

describe('failure reporting', () => {
  it('names the phase and the step', () => {
    expect(formatFailure(new VerifyError('render', 'boom', 4))).toBe('FAIL render (step index 4): boom')
    expect(formatFailure(new VerifyError('build', 'tsc failed'))).toBe('FAIL build: tsc failed')
    expect(formatFailure(new Error('weird'))).toBe('FAIL verify: weird')
  })
})
