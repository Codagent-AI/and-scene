import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { collectBrowserErrors, renderRoute } from '../../../scripts/lib/render.mjs'
import {
  DEFAULT_STEP_TIMEOUT_MS,
  formatFailure,
  parseArgs,
  selectRoutes,
  VerifyError,
} from '../../../scripts/lib/verify-core.mjs'
import { HOST, previewUrl } from '../../../scripts/lib/loopback.mjs'

describe('arguments', () => {
  it('defaults to every route with a 5s step timeout (L-67)', () => {
    expect(parseArgs([], {})).toEqual({ slug: undefined, timeoutMs: 5000 })
    expect(DEFAULT_STEP_TIMEOUT_MS).toBe(5000)
  })

  it('takes a positional slug and timeout overrides', () => {
    expect(parseArgs(['my-talk', '--timeout=1500'], {})).toEqual({ slug: 'my-talk', timeoutMs: 1500 })
    expect(parseArgs([], { VERIFY_STEP_TIMEOUT_MS: '900' }).timeoutMs).toBe(900)
  })

  it('rejects unknown options', () => {
    expect(() => parseArgs(['--wat'])).toThrow(VerifyError)
  })
})

describe('route selection (C-7)', () => {
  const registry = [{ slug: 'sample' }, { slug: 'other' }, { slug: 'third' }]

  it('renders the sample fully and the others at their first step', () => {
    expect(selectRoutes({ registry, sampleSlug: 'sample' })).toEqual([
      { slug: 'sample', allSteps: true },
      { slug: 'other', allSteps: false },
      { slug: 'third', allSteps: false },
    ])
  })

  it('limits the run to a supplied slug', () => {
    expect(selectRoutes({ registry, sampleSlug: 'sample', only: 'other' })).toEqual([{ slug: 'other', allSteps: false }])
    expect(selectRoutes({ registry, sampleSlug: 'sample', only: 'sample' })).toEqual([{ slug: 'sample', allSteps: true }])
  })

  it('fails for an unknown slug and renders first steps without a sample', () => {
    expect(() => selectRoutes({ registry, sampleSlug: 'sample', only: 'nope' })).toThrow(/no registered presentation/)
    expect(selectRoutes({ registry, sampleSlug: undefined }).every((r: { allSteps: boolean }) => !r.allSteps)).toBe(true)
  })
})

describe('failure reporting (L-68)', () => {
  it('names the phase and the step', () => {
    expect(formatFailure(new VerifyError('render', 'console error: boom', { step: 4 }))).toBe(
      'VERIFY FAILED: render (step index 4, step 5): console error: boom',
    )
    expect(formatFailure(new VerifyError('build', 'x'))).toBe('VERIFY FAILED: build: x')
    expect(formatFailure(new Error('oops'))).toMatch(/^VERIFY FAILED: internal: oops/)
  })
})

describe('IPv4 loopback (L-65)', () => {
  it('derives every URL from one 127.0.0.1 host', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(previewUrl(4173, '/x')).toBe('http://127.0.0.1:4173/x')
  })

  it.each(['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs', 'scripts/lib/render.mjs'])(
    '%s never builds a localhost URL or host argument',
    (file) => {
      const code = readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '')
      expect(code).not.toMatch(/localhost|\[::1\]|0\.0\.0\.0/)
    },
  )

  it('starts the preview on the shared host and probes the same URL', () => {
    const preview = readFileSync('scripts/lib/preview.mjs', 'utf8')
    expect(preview).toMatch(/'--host', HOST/)
    expect(preview).toMatch(/waitReady\(previewUrl\(port\)/)
  })
})

function fakePage(states: Array<{ count: number; index: number; title: string; caption: string; mode: string } | null>) {
  const emitter = new EventEmitter()
  let i = 0
  const presses: string[] = []
  const page = Object.assign(emitter, {
    goto: vi.fn(async () => {}),
    evaluate: vi.fn(async () => states[Math.min(i, states.length - 1)]),
    keyboard: {
      press: vi.fn(async (k: string) => {
        presses.push(k)
        i++
      }),
    },
    waitForTimeout: vi.fn(async (ms: number) => {
      await new Promise((r) => setTimeout(r, Math.min(ms, 1)))
    }),
  })
  return { page, presses }
}
const st = (count: number, index: number) => ({ count, index, title: `T${index + 1}`, caption: `C${index + 1}`, mode: 'browse' })
const run = (page: unknown, extra: object = {}) =>
  renderRoute({ page, url: 'http://127.0.0.1:1/x', allSteps: true, reference: null, errors: [], timeoutMs: 30, log: () => {}, ...extra })

describe('render loop (L-52, L-66, L-67)', () => {
  it('derives its bounds from data-step-count, not a hard-coded nine', async () => {
    const { page, presses } = fakePage([st(3, 0), st(3, 1), st(3, 2)])
    await expect(run(page)).resolves.toEqual({ count: 3, rendered: 3 })
    expect(presses).toEqual(['ArrowRight', 'ArrowRight'])
    const big = fakePage(Array.from({ length: 12 }, (_, i) => st(12, i)))
    await expect(run(big.page)).resolves.toEqual({ count: 12, rendered: 12 })
  })

  it('renders only the first step of non-sample routes', async () => {
    const { page, presses } = fakePage([st(5, 0)])
    await expect(run(page, { allSteps: false })).resolves.toEqual({ count: 5, rendered: 1 })
    expect(presses).toEqual([])
  })

  it('fails when the index does not advance and names the expected step', async () => {
    const { page } = fakePage([st(4, 0), st(4, 1), st(4, 1)])
    const error = await run(page).catch((e) => e)
    expect(error).toBeInstanceOf(VerifyError)
    expect(error).toMatchObject({ phase: 'render', step: 2 })
    expect(error.message).toMatch(/did not advance: data-step-index is 1, expected 2/)
  })

  it('never counts a stale index as success', async () => {
    const stale = fakePage([st(2, 0), st(2, 0)])
    await expect(run(stale.page)).rejects.toMatchObject({ phase: 'render', step: 1 })
  })

  it('fails when no presentation hooks render', async () => {
    const { page } = fakePage([null])
    await expect(run(page)).rejects.toMatchObject({ phase: 'render', step: 0 })
  })

  it('fails with the offending step when a console or page error appears there', async () => {
    const errors: string[] = []
    const { page } = fakePage([st(4, 0), st(4, 1), st(4, 2), st(4, 3)])
    const press = page.keyboard.press
    page.keyboard.press = vi.fn(async (k: string) => {
      await press(k)
      if (page.keyboard.press.mock.calls.length === 2) errors.push('console error: step three broke')
    })
    const error = await run(page, { errors }).catch((e) => e)
    expect(error).toMatchObject({ phase: 'render', step: 2 })
    expect(error.message).toMatch(/step three broke/)
  })

  it('does not discard errors that arrived after the previous route returned', async () => {
    const errors = ['console error: late from previous route']
    const { page } = fakePage([st(1, 0)])
    await expect(run(page, { errors })).rejects.toMatchObject({ phase: 'render', step: 0 })
    expect(errors).toHaveLength(1)
  })

  it('fails when the rendered title or caption differs from the reference', async () => {
    const reference = { steps: [{ title: 'T1', caption: 'C1' }, { title: 'Other', caption: 'C2' }] }
    const { page } = fakePage([st(2, 0), st(2, 1)])
    await expect(run(page, { reference })).rejects.toMatchObject({ step: 1, message: expect.stringMatching(/rendered title "T2", expected "Other"/) })
    const capt = { steps: [{ title: 'T1', caption: 'C1' }, { title: 'T2', caption: 'nope' }] }
    await expect(run(fakePage([st(2, 0), st(2, 1)]).page, { reference: capt })).rejects.toMatchObject({ step: 1 })
  })

  it('fails when the step count differs from the reference', async () => {
    const reference = { steps: [{ title: 'T1', caption: 'C1' }] }
    await expect(run(fakePage([st(2, 0)]).page, { reference })).rejects.toMatchObject({ phase: 'render', step: 0 })
  })
})

describe('browser error handlers (L-66)', () => {
  it('records both console errors and uncaught page errors, but not other console output', () => {
    const page = new EventEmitter()
    const errors = collectBrowserErrors(page as never)
    page.emit('console', { type: () => 'log', text: () => 'fine' })
    page.emit('console', { type: () => 'error', text: () => 'bad' })
    page.emit('pageerror', new Error('thrown'))
    expect(errors).toEqual(['console error: bad', 'uncaught page error: thrown'])
  })

  it('is installed before navigation and kept for the whole run in verify.mjs', () => {
    const code = readFileSync('scripts/verify.mjs', 'utf8')
    expect(code.indexOf('collectBrowserErrors(page)')).toBeGreaterThan(-1)
    expect(code.indexOf('collectBrowserErrors(page)')).toBeLessThan(code.indexOf('renderRoute({'))
    expect(code).not.toMatch(/\.off\(|removeListener/)
  })
})
