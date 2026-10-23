// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  HOST,
  compareOutline,
  createErrorCollector,
  exitCodeFor,
  fail,
  formatResult,
  pass,
  previewUrl,
  registeredSlugs,
  registryHasSlug,
  renderRoute,
  selectTargets,
} from '../../scripts/verify.mjs'

const OUTLINE = [
  { era: 'a', title: 'One', caption: 'first' },
  { era: 'a', title: 'Two', caption: 'second' },
  { era: 'b', title: 'Three', caption: 'third' },
]

describe('reference sample checks', () => {
  it('accepts an identical outline', () => {
    expect(compareOutline(OUTLINE, structuredClone(OUTLINE))).toEqual([])
  })
  it.each([
    ['a missing step', (o: typeof OUTLINE) => o.slice(0, 2), /expected 3 steps but rendered 2/],
    ['an extra step', (o: typeof OUTLINE) => [...o, o[0]], /expected 3 steps but rendered 4/],
    ['reordered steps', (o: typeof OUTLINE) => [o[1], o[0], o[2]], /step 1 title/],
    ['an edited title', (o: typeof OUTLINE) => o.map((s, i) => (i === 2 ? { ...s, title: 'Tree' } : s)), /step 3 title.*Three.*Tree/],
    ['an edited caption', (o: typeof OUTLINE) => o.map((s, i) => (i === 1 ? { ...s, caption: 'x' } : s)), /step 2 caption/],
    ['an edited era', (o: typeof OUTLINE) => o.map((s, i) => (i === 0 ? { ...s, era: 'z' } : s)), /step 1 era/],
  ])('reports %s', (_n, mutate, re) => {
    const problems = compareOutline(OUTLINE, mutate(structuredClone(OUTLINE)))
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.join('\n')).toMatch(re)
  })

  it('reads registered slugs from the registry source', () => {
    const src = `export const presentations = [\n  { slug: 'one', title: 'x', load: () => import('./one/Talk') },\n  { slug: "two-b", title: 'y', load: () => import('./t/Talk') },\n]`
    expect(registeredSlugs(src)).toEqual(['one', 'two-b'])
    expect(registryHasSlug(src, 'two-b')).toBe(true)
    expect(registryHasSlug(src, 'three')).toBe(false)
    expect(registryHasSlug('', 'one')).toBe(false)
  })
})

describe('target selection', () => {
  const slugs = ['a', 'b', 'c']
  it('renders the reference by default, every registered presentation without one, or the requested slug', () => {
    expect(selectTargets({ slugs, reference: 'b' })).toEqual({ targets: ['b'] })
    expect(selectTargets({ slugs })).toEqual({ targets: slugs })
    expect(selectTargets({ slugs, reference: 'b', requested: 'c' })).toEqual({ targets: ['c'] })
  })
  it('rejects an unregistered requested slug, listing what is registered', () => {
    expect(selectTargets({ slugs, requested: 'zzz' }).error).toMatch(/"zzz" is not registered.*a, b, c/)
    expect(selectTargets({ slugs: [], requested: 'zzz' }).error).toMatch(/registered: none/)
  })
})

describe('loopback addressing', () => {
  it('builds preview URLs on 127.0.0.1', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(previewUrl(4173)).toBe('http://127.0.0.1:4173/')
    expect(previewUrl(4173, '/talk')).toBe('http://127.0.0.1:4173/talk')
  })
  it.each(['verify.mjs', 'inspect-presentation.mjs'])('scripts/%s never mentions localhost', (file) => {
    const src = readFileSync(path.join(__dirname, '../../scripts', file), 'utf8')
    expect(src).not.toMatch(/localhost/i)
  })
})

describe('outcome reporting', () => {
  it('formats a clear pass and a failure that names the phase and step', () => {
    expect(formatResult(pass('(build ok)'))).toBe('verify: PASS (build ok)')
    expect(formatResult(fail('build', 'tsc failed'))).toBe('verify: FAIL [build] tsc failed')
    expect(formatResult(fail('render', 'boom', 4))).toBe('verify: FAIL [render] step index 4: boom')
    expect(formatResult(fail('transition', 'stuck', 0))).toContain('step index 0')
  })
  it('exits zero only for a pass', () => {
    expect(exitCodeFor(pass())).toBe(0)
    expect(exitCodeFor(fail('sample', 'x'))).toBe(1)
    expect(formatResult(fail('sample', 'x'))).not.toMatch(/PASS/)
  })
})

describe('error collection', () => {
  it('attributes console errors and page errors to the current step and ignores other console output', () => {
    let step = 0
    const c = createErrorCollector(() => step)
    c.onConsole({ type: () => 'log', text: () => 'hello' })
    c.onConsole({ type: () => 'warning', text: () => 'warn' })
    expect(c.errors).toEqual([])
    c.onConsole({ type: () => 'error', text: () => 'bad' })
    step = 3
    c.onPageError(new Error('uncaught'))
    expect(c.errors).toEqual([
      { step: 0, message: 'console.error: bad' },
      { step: 3, message: 'uncaught exception: uncaught' },
    ])
  })
})

/** A scripted page: `events[i]` fire when the page settles on step i. */
function fakePage(opts: { count: number; events?: Record<number, 'console' | 'pageerror'>; stallAt?: number; noHook?: boolean }) {
  const handlers: Record<string, (x: unknown) => void> = {}
  let idx = 0
  const fired = new Set<number>()
  return {
    on: (e: string, fn: (x: unknown) => void) => void (handlers[e] = fn),
    goto: async () => {},
    close: async () => {},
    waitForSelector: async () => {
      if (opts.noHook) {
        handlers.pageerror?.(new Error('bundle crashed'))
        throw new Error('timeout')
      }
    },
    getAttribute: async (_s: string, a: string) => (a === 'data-step-count' ? String(opts.count) : String(idx)),
    evaluate: async () => ({ era: 'e', title: `T${idx}`, caption: `C${idx}` }),
    waitForTimeout: async () => {
      const ev = opts.events?.[idx]
      if (ev && !fired.has(idx)) {
        fired.add(idx)
        if (ev === 'console') handlers.console?.({ type: () => 'error', text: () => `console fail ${idx}` })
        else handlers.pageerror?.(new Error(`page fail ${idx}`))
      }
    },
    keyboard: { press: async () => void (opts.stallAt === idx ? 0 : idx++) },
    waitForFunction: async (_f: unknown, n: number) => {
      if (idx !== n) throw new Error('timeout')
    },
  }
}
const fakeBrowser = (page: ReturnType<typeof fakePage>) => ({ newPage: async () => page })

interface RouteResult {
  ok: boolean
  phase?: string
  step?: number
  message?: string
  count?: number
  outline?: { title: string }[]
}
const render = async (page: ReturnType<typeof fakePage>) =>
  (await renderRoute(fakeBrowser(page), 1, 'talk')) as RouteResult

describe('renderRoute', () => {
  it('passes a clean route and returns the rendered outline', async () => {
    const r = await render(fakePage({ count: 4 }))
    expect(r.ok).toBe(true)
    expect(r.count).toBe(4)
    expect(r.outline?.map((o) => o.title)).toEqual(['T0', 'T1', 'T2', 'T3'])
  })
  it.each([
    ['console', 0],
    ['console', 3],
    ['pageerror', 0],
    ['pageerror', 2],
  ] as const)('fails on a %s error at step %i, naming that step', async (kind, at) => {
    const r = await render(fakePage({ count: 5, events: { [at]: kind } }))
    expect(r.ok).toBe(false)
    expect(r.phase).toBe('render')
    expect(r.step).toBe(at)
    expect(r.message).toContain(kind === 'console' ? `console fail ${at}` : `page fail ${at}`)
    expect(r.message).toContain('/talk')
  })
  it('fails with the offending step when the public step index does not advance', async () => {
    const r = await render(fakePage({ count: 6, stallAt: 3 }))
    expect(r).toMatchObject({ ok: false, phase: 'transition', step: 3 })
    expect(r.message).toMatch(/did not advance from 3 to 4/)
  })
  it('surfaces the crash when the presentation never renders its hooks', async () => {
    const r = await render(fakePage({ count: 1, noHook: true }))
    expect(r).toMatchObject({ ok: false, phase: 'render', step: 0 })
    expect(r.message).toContain('bundle crashed')
  })
})
