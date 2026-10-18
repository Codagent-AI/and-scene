import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as verify from '../../scripts/verify.mjs'
import { HOST, PhaseError } from '../../scripts/lib/preview.mjs'

const REGISTRY = `
export const PRESENTATIONS = [
  { slug: 'one', title: 'First', load: () => import('./one/Talk') },
  {
    slug: "two",
    title: "Second",
    load: () => import('./two/Talk'),
  },
]`

describe('validateConfig', () => {
  const ok = { presentations: [{ slug: 'a', steps: [{ era: 'e', title: 't', caption: 'c' }] }] }
  it('accepts a valid config', () => {
    expect(verify.validateConfig(ok)).toBe(ok)
    expect(verify.validateConfig({ presentations: [{ slug: 'a' }] })).toBeTruthy()
  })
  it.each([
    [null],
    [{}],
    [{ presentations: [] }],
    [{ presentations: [{}] }],
    [{ presentations: [{ slug: 'a', title: 3 }] }],
    [{ presentations: [{ slug: 'a', steps: [] }] }],
    [{ presentations: [{ slug: 'a', steps: [{ era: 'e', title: 't' }] }] }],
    [{ presentations: [{ slug: 'a', steps: [{ era: 'e', title: '', caption: 'c' }] }] }],
  ])('fails closed on malformed config %j', (config) => {
    expect(() => verify.validateConfig(config)).toThrow(PhaseError)
    try {
      verify.validateConfig(config)
    } catch (e) {
      expect((e as { phase: string }).phase).toBe('sample')
    }
  })
})

describe('registry checks', () => {
  const registry = verify.parseRegistry(REGISTRY)
  it('parses single and double quoted multi-line entries', () => {
    expect(registry).toEqual([
      { slug: 'one', title: 'First' },
      { slug: 'two', title: 'Second' },
    ])
  })
  it('passes when required presentations are registered', () => {
    expect(() => verify.checkRequired({ presentations: [{ slug: 'one', title: 'First' }, { slug: 'two' }] }, registry)).not.toThrow()
  })
  it('fails for an unregistered, retitled or duplicated presentation, naming the sample phase', () => {
    for (const [config, reg, text] of [
      [{ presentations: [{ slug: 'missing' }] }, registry, 'missing'],
      [{ presentations: [{ slug: 'one', title: 'Other' }] }, registry, 'expected "Other"'],
      [{ presentations: [{ slug: 'one' }] }, [...registry, registry[0]], 'duplicate'],
      [{ presentations: [{ slug: 'one' }] }, [], 'not registered'],
    ] as const) {
      expect(() => verify.checkRequired(config, reg)).toThrow(text)
    }
  })
  it('the repository config requires the nine-step reference sample, in the spec order', () => {
    const config = JSON.parse(readFileSync('verify.config.json', 'utf8'))
    const sample = config.presentations.find((p: { slug: string }) => p.slug === 'how-to-make-a-presentation')
    expect(sample.title).toBe('How to Use This Skill to Make a Presentation')
    expect(sample.steps).toHaveLength(9)
  })
})

describe('compareStep', () => {
  const expected = { era: 'e', title: 't', caption: 'c' }
  it('returns null on match or when nothing is required', () => {
    expect(verify.compareStep(expected, { ...expected }, 0)).toBeNull()
    expect(verify.compareStep(undefined, { era: 'x' }, 0)).toBeNull()
  })
  it.each(['era', 'title', 'caption'])('reports a %s mismatch with the step number', (k) => {
    expect(verify.compareStep(expected, { ...expected, [k]: 'wrong' }, 3)).toMatch(new RegExp(`step 4 ${k}`))
  })
})

function fakePage(url: string) {
  const page = new EventEmitter() as EventEmitter & Record<string, unknown>
  Object.assign(page, { url: () => url })
  return page
}

describe('trackErrors', () => {
  it('records console errors and page errors but not other console output', () => {
    const page = fakePage('http://127.0.0.1/')
    const errors = verify.trackErrors(page)
    page.emit('console', { type: () => 'log', text: () => 'fine' })
    page.emit('console', { type: () => 'error', text: () => 'boom' })
    page.emit('pageerror', new Error('uncaught'))
    expect(errors).toEqual(['console.error: boom', 'uncaught error: uncaught'])
  })
})

describe('renderRoute', () => {
  // A scripted page: `indices` is what data-step-index shows after each ArrowRight (undefined = stalls).
  function scripted(opts: { count: number; stallAt?: number; errorAt?: { step: number; text: string }; host?: string }) {
    const errors: string[] = []
    let index = 0
    const content = (i: number) => ({ index: i, era: 'e', title: `t${i}`, caption: `c${i}` })
    const page = {
      url: () => `http://${opts.host ?? HOST}:1/x`,
      goto: async () => {},
      waitForSelector: async () => {},
      getAttribute: async () => String(opts.count),
      waitForTimeout: async () => {},
      keyboard: {
        press: async () => {
          if (opts.stallAt !== index + 1) index++
        },
      },
      waitForFunction: async (_fn: unknown, n: number) => {
        if (index !== n) throw new Error('timeout')
      },
      evaluate: async () => {
        if (opts.errorAt?.step === index) errors.push(opts.errorAt.text)
        return content(index)
      },
    }
    return { page, errors }
  }

  it('steps through every step and returns the count', async () => {
    const { page, errors } = scripted({ count: 4 })
    expect(await verify.renderRoute(page, 'u', 's', undefined, errors)).toBe(4)
  })
  it('fails a stalled transition, naming the step', async () => {
    const { page, errors } = scripted({ count: 5, stallAt: 3 })
    await expect(verify.renderRoute(page, 'u', 's', undefined, errors)).rejects.toMatchObject({ phase: 'render', step: 3 })
  })
  it('does not ignore errors already collected, even on the last step', async () => {
    const early = scripted({ count: 3 })
    early.errors.push('console.error: at startup')
    await expect(verify.renderRoute(early.page, 'u', 's', undefined, early.errors)).rejects.toMatchObject({ step: 0 })
    // An error that surfaces while the final step is being read must still fail that step.
    const late = scripted({ count: 3 })
    let reads = 0
    const failing = {
      ...late.page,
      evaluate: async () => {
        if (reads++ === 2) late.errors.push('uncaught error: during final read')
        return { index: reads - 1 }
      },
    }
    await expect(verify.renderRoute(failing, 'u', 's', undefined, late.errors)).rejects.toMatchObject({
      step: 2,
      message: expect.stringContaining('during final read'),
    })
  })
  it('fails when the observed narration differs from the required steps', async () => {
    const { page, errors } = scripted({ count: 2 })
    const expected = [
      { era: 'e', title: 't0', caption: 'c0' },
      { era: 'e', title: 'WRONG', caption: 'c1' },
    ]
    await expect(verify.renderRoute(page, 'u', 's', expected, errors)).rejects.toMatchObject({ step: 1 })
  })
  it('fails when the step count differs from the required steps', async () => {
    const { page, errors } = scripted({ count: 2 })
    await expect(verify.renderRoute(page, 'u', 's', [{ era: 'e', title: 't', caption: 'c' }], errors)).rejects.toThrow('expected 1 steps, found 2')
  })
  it('dwells longer than a full transition before reading each step', () => {
    expect(verify.SETTLE_MS).toBeGreaterThan((0.6 + 0.65 + 0.4) * 1000)
  })
  it('requires the browser to stay on 127.0.0.1', async () => {
    const { page, errors } = scripted({ count: 2, host: 'localhost' })
    await expect(verify.renderRoute(page, 'u', 's', undefined, errors)).rejects.toThrow('127.0.0.1')
  })
})

describe('loopback host', () => {
  it('uses 127.0.0.1 for the preview, probe and browser URLs, never localhost', () => {
    expect(HOST).toBe('127.0.0.1')
    for (const file of ['scripts/verify.mjs', 'scripts/lib/preview.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/localhost|\[::1\]/)
    }
    const preview = readFileSync('scripts/lib/preview.mjs', 'utf8')
    expect(preview).toContain('`http://${HOST}:${port}`')
    expect(preview).toContain("'--host', HOST")
  })
})
