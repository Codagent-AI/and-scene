import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  EXPECTED_SAMPLE, HOST, SAMPLE_SLUG, VerifyError, buildApp, checkRoute, checkSample, formatOutcome,
  loadSample, parseRegistrySlugs, previewUrl, renderAll, runPhases, withPreview,
} from '../../scripts/verify.mjs'
import { repoRoot } from './helpers.ts'

const goodSteps = () => EXPECTED_SAMPLE.map((s) => ({ id: 'x', ...s }))
const tmp = () => mkdtempSync(path.join(os.tmpdir(), 'verify-unit-'))

describe('sample check', () => {
  const ok = { slugs: [SAMPLE_SLUG], steps: goodSteps() }

  it('accepts the exact outline', () => {
    expect(() => checkSample(ok)).not.toThrow()
  })

  it.each([
    ['an unregistered sample', { slugs: ['other'], steps: goodSteps() }, /not registered/],
    ['missing step data', { slugs: [SAMPLE_SLUG], steps: undefined }, /missing or malformed/],
    ['a short outline', { slugs: [SAMPLE_SLUG], steps: goodSteps().slice(0, 8) }, /8 steps, expected 9/],
    ['an extra step', { slugs: [SAMPLE_SLUG], steps: [...goodSteps(), goodSteps()[0]] }, /10 steps/],
    ['a malformed step', { slugs: [SAMPLE_SLUG], steps: [...goodSteps().slice(0, 4), null, ...goodSteps().slice(5)] }, /step 4 is malformed/],
  ])('rejects %s in the sample phase', (_n, input, message) => {
    expect(() => checkSample(input as never)).toThrow(message)
    try {
      checkSample(input as never)
    } catch (e) {
      expect((e as VerifyError).phase).toBe('sample')
    }
  })

  it('rejects out-of-order steps and names the first wrong one', () => {
    const steps = goodSteps()
    ;[steps[0], steps[1]] = [steps[1], steps[0]]
    expect(() => checkSample({ slugs: [SAMPLE_SLUG], steps })).toThrow(/step 0 title/)
  })

  it.each(['era', 'title', 'caption'])('rejects a wrong %s even when the count is right', (field) => {
    const steps = goodSteps()
    steps[6] = { ...steps[6], [field]: 'changed' }
    try {
      checkSample({ slugs: [SAMPLE_SLUG], steps })
      throw new Error('should have thrown')
    } catch (e) {
      expect((e as VerifyError).message).toContain(`step 6 ${field}`)
      expect((e as VerifyError).step).toBe(6)
    }
  })

  it('compares captions exactly, including dashes and apostrophes', () => {
    const steps = goodSteps()
    steps[8] = { ...steps[8], title: 'You’re looking at one' }
    expect(() => checkSample({ slugs: [SAMPLE_SLUG], steps })).toThrow(/step 8 title/)
  })

  it('reads slugs from the registry source and loads steps from disk', async () => {
    expect(parseRegistrySlugs("{ slug: 'a', title: 'x' }, { slug: \"b-c\" }")).toEqual(['a', 'b-c'])
    const real = await loadSample(repoRoot)
    expect(() => checkSample(real)).not.toThrow()
    const empty = await loadSample(tmp())
    expect(empty).toEqual({ slugs: [], steps: undefined })
    expect(() => checkSample(empty)).toThrow(VerifyError)
  })
})

describe('phase runner and reporting', () => {
  const quiet = () => {}

  it('runs phases in order and passes', async () => {
    const seen: string[] = []
    const outcome = await runPhases(
      ['a', 'b', 'c'].map((name) => ({ name, run: async () => void seen.push(name) })),
      quiet,
    )
    expect(outcome).toEqual({ ok: true })
    expect(seen).toEqual(['a', 'b', 'c'])
    expect(formatOutcome(outcome)).toBe('VERIFY PASSED')
  })

  it('stops at the first failure, names its phase and step, and never reports success', async () => {
    const seen: string[] = []
    const outcome = await runPhases(
      [
        { name: 'build', run: async () => void seen.push('build') },
        { name: 'render', run: async () => { throw new VerifyError('render', 'boom', 4) } },
        { name: 'never', run: async () => void seen.push('never') },
      ],
      quiet,
    )
    expect(outcome).toEqual({ ok: false, phase: 'render', step: 4, message: 'boom' })
    expect(seen).toEqual(['build'])
    expect(formatOutcome(outcome)).toBe('VERIFY FAILED phase=render step=4: boom')
  })

  it('attributes unexpected errors to the running phase', async () => {
    const outcome = await runPhases([{ name: 'sample', run: async () => { throw new Error('oops') } }], quiet)
    expect(outcome).toMatchObject({ ok: false, phase: 'sample', message: 'oops' })
    expect(formatOutcome(outcome)).toBe('VERIFY FAILED phase=sample: oops')
  })

  it('propagates a failed build as the build phase', async () => {
    const root = tmp()
    writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: { build: 'echo type error TS2322 && exit 3' } }))
    const outcome = await runPhases([{ name: 'build', run: () => buildApp(root) }], quiet)
    expect(outcome).toMatchObject({ ok: false, phase: 'build' })
    expect((outcome as { message: string }).message).toContain('exit 3')
    expect((outcome as { message: string }).message).toContain('TS2322')
    writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: { build: 'exit 0' } }))
    await expect(buildApp(root)).resolves.toBeUndefined()
  })
})

describe('IPv4 loopback', () => {
  it('builds every URL on 127.0.0.1', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(previewUrl(4173)).toBe('http://127.0.0.1:4173/')
    expect(previewUrl(4173, '/how-to-make-a-presentation')).toBe('http://127.0.0.1:4173/how-to-make-a-presentation')
  })

  it('never mentions localhost in the verification or inspection scripts', () => {
    for (const f of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(readFileSync(path.join(repoRoot, f), 'utf8'), f).not.toMatch(/localhost/i)
    }
  })
})

/** A stand-in for `vite preview` that serves one page on the requested host and port. */
function fakeViteRoot(script: string) {
  const root = tmp()
  mkdirSync(path.join(root, 'node_modules/vite/bin'), { recursive: true })
  writeFileSync(path.join(root, 'node_modules/vite/bin/vite.js'), script)
  return root
}
const SERVER = `
require('node:fs').writeFileSync(__dirname + '/pid', String(process.pid))
const http = require('node:http')
const a = process.argv
const host = a[a.indexOf('--host') + 1]
const port = Number(a[a.indexOf('--port') + 1])
http.createServer((_, res) => res.end('ok')).listen(port, host)
`
const canConnect = (port: number) =>
  new Promise<boolean>((resolve) => {
    const s = net.connect(port, HOST)
    s.once('connect', () => (s.destroy(), resolve(true)))
    s.once('error', () => resolve(false))
  })

const pidOf = (root: string) => Number(readFileSync(path.join(root, 'node_modules/vite/bin/pid'), 'utf8'))
const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
const NEVER_READY = `require('node:fs').writeFileSync(__dirname + '/pid', String(process.pid)); setInterval(() => {}, 1000)`

describe('preview process ownership', () => {
  it('terminates the preview process after a successful check', async () => {
    const root = fakeViteRoot(SERVER)
    await withPreview(root, async () => {}, () => {})
    expect(isAlive(pidOf(root))).toBe(false)
  })

  it('terminates the preview process when the check throws', async () => {
    const root = fakeViteRoot(SERVER)
    await expect(withPreview(root, async () => { throw new Error('x') }, () => {})).rejects.toThrow('x')
    expect(isAlive(pidOf(root))).toBe(false)
  })

  it('terminates a live preview that never becomes ready', async () => {
    const root = fakeViteRoot(NEVER_READY)
    await expect(withPreview(root, async () => {}, () => {}, { readyTimeoutMs: 600 })).rejects.toMatchObject({
      phase: 'render',
      message: expect.stringContaining('not ready'),
    })
    expect(isAlive(pidOf(root))).toBe(false)
  })

  it('terminates the preview process when the browser cannot start', async () => {
    const root = fakeViteRoot(SERVER)
    const launch = async () => { throw new Error('no chromium here') }
    await expect(renderAll(root, ['a'], () => {}, { launch })).rejects.toMatchObject({
      phase: 'render',
      message: expect.stringContaining('cannot launch Chromium'),
    })
    expect(isAlive(pidOf(root))).toBe(false)
  })

  it('logs the preview pid so callers can check it', async () => {
    const root = fakeViteRoot(SERVER)
    const lines: string[] = []
    await withPreview(root, async () => {}, (l: string) => lines.push(l))
    expect(lines[0]).toMatch(/^\[verify\] preview http:\/\/127\.0\.0\.1:\d+\/ \(pid \d+\)$/)
  })
})

describe('preview lifecycle', () => {
  it('serves on the loopback address and stops the server afterwards', async () => {
    const root = fakeViteRoot(SERVER)
    let port = 0
    await withPreview(root, async (p: number) => {
      port = p
      expect(await canConnect(p)).toBe(true)
    }, () => {})
    expect(await canConnect(port)).toBe(false)
  })

  it('stops the server when the check inside throws', async () => {
    const root = fakeViteRoot(SERVER)
    let port = 0
    await expect(
      withPreview(root, async (p: number) => {
        port = p
        throw new VerifyError('render', 'check failed', 2)
      }, () => {}),
    ).rejects.toThrow('check failed')
    expect(await canConnect(port)).toBe(false)
  })

  it('reports a preview that dies before it is ready as a render failure', async () => {
    const root = fakeViteRoot('process.exit(1)')
    await expect(withPreview(root, async () => {}, () => {})).rejects.toMatchObject({
      phase: 'render',
      message: expect.stringContaining('exited before it was ready'),
    })
  })
})

type Handler = (arg: unknown) => void
interface FakeOptions {
  stuckAt?: number
  fault?: { step: number; kind: 'console' | 'pageerror'; afterMs: number }
  gotoFault?: boolean
  noChrome?: boolean
  titles?: string[]
  warnings?: boolean
  crashAt?: number
}
class FakePage {
  handlers: Record<string, Handler[]> = {}
  index = 0
  count: number
  private opts: FakeOptions
  constructor(count = 3, opts: FakeOptions = {}) {
    this.count = count
    this.opts = opts
  }
  on(evt: string, fn: Handler) {
    ;(this.handlers[evt] ??= []).push(fn)
  }
  emit(evt: string, arg: unknown) {
    for (const h of this.handlers[evt] ?? []) h(arg)
  }
  private crashed = false
  private enter(i: number) {
    this.index = i
    if (this.opts.crashAt === i) {
      // A render exception unmounts the app: the chrome hooks disappear.
      this.crashed = true
      this.emit('pageerror', new Error('render exploded'))
    }
    const f = this.opts.fault
    if (f && f.step === i) {
      const fire = () => {
        if (f.kind === 'console') this.emit('console', { type: () => 'error', text: () => 'boom' })
        else this.emit('pageerror', new Error('uncaught'))
      }
      if (f.afterMs === 0) fire()
      else setTimeout(fire, f.afterMs)
    }
  }
  async goto() {
    if (this.opts.gotoFault) this.emit('console', { type: () => 'error', text: () => 'failed to load' })
    if (this.opts.warnings) this.emit('console', { type: () => 'warning', text: () => 'just a warning' })
    this.enter(0)
  }
  locator = (sel: string) => {
    if (sel === '[data-step-count]') {
      return {
        waitFor: async () => {
          if (this.opts.noChrome) throw new Error('timeout')
        },
        getAttribute: async (name: string) => {
          if (this.crashed) throw new Error('element is gone')
          return name === 'data-step-count' ? String(this.count) : String(this.index)
        },
      }
    }
    return {
      first: () => ({
        textContent: async () =>
          sel === '[data-presentation-title]'
            ? (this.opts.titles?.[this.index] ?? EXPECTED_SAMPLE[this.index]?.title)
            : EXPECTED_SAMPLE[this.index]?.caption,
      }),
    }
  }
  keyboard = {
    press: async () => {
      if (this.opts.stuckAt !== this.index) this.enter(this.index + 1)
    },
  }
  waitForFunction = async (_fn: unknown, [n]: [number]) => {
    if (this.crashed || this.index !== n) throw new Error('timeout')
  }
}
const run = (page: FakePage, extra: Record<string, unknown> = {}) =>
  checkRoute(page as never, 'http://127.0.0.1:1/x', { settleMs: 15, ...extra })

describe('render check', () => {
  it('walks every step and ignores non-error console output', async () => {
    const logs: string[] = []
    await run(new FakePage(3, { warnings: true }), { log: (l: string) => logs.push(l) })
    expect(logs).toEqual(['[verify] step 0 of 2 ok', '[verify] step 1 of 2 ok', '[verify] step 2 of 2 ok'])
  })

  it('verifies the sample titles and captions in order at every step', async () => {
    await run(new FakePage(9), { expected: EXPECTED_SAMPLE })
    await expect(run(new FakePage(9, { titles: [] }), { expected: EXPECTED_SAMPLE.slice(0, 8) })).rejects.toThrow(/expected 8/)
    const titles = EXPECTED_SAMPLE.map((s) => s.title)
    titles[5] = 'Wrong'
    await expect(run(new FakePage(9, { titles }), { expected: EXPECTED_SAMPLE })).rejects.toMatchObject({ phase: 'render', step: 5 })
  })

  it('fails on a console error and names the step it happened on', async () => {
    await expect(run(new FakePage(4, { fault: { step: 2, kind: 'console', afterMs: 1 } }))).rejects.toMatchObject({
      phase: 'render',
      step: 2,
      message: 'console error: boom',
    })
  })

  it('fails on an uncaught page error and names the step', async () => {
    await expect(run(new FakePage(4, { fault: { step: 1, kind: 'pageerror', afterMs: 1 } }))).rejects.toMatchObject({
      phase: 'render',
      step: 1,
      message: 'page error: uncaught',
    })
  })

  it('catches an error that arrives late in a step\'s settle interval, including the last step', async () => {
    await expect(run(new FakePage(3, { fault: { step: 2, kind: 'console', afterMs: 10 } }))).rejects.toMatchObject({ step: 2 })
  })

  it('attributes an error raised synchronously while navigating to the next step to that step', async () => {
    await expect(run(new FakePage(4, { fault: { step: 2, kind: 'console', afterMs: 0 } }))).rejects.toMatchObject({ step: 2 })
  })

  it('attributes errors raised while loading the route to step 0', async () => {
    await expect(run(new FakePage(3, { gotoFault: true }))).rejects.toMatchObject({ step: 0 })
  })

  it('fails when ArrowRight does not advance the step index, naming that step', async () => {
    await expect(run(new FakePage(5, { stuckAt: 2 }))).rejects.toMatchObject({
      phase: 'render',
      step: 2,
      message: expect.stringContaining('did not advance'),
    })
  })

  it('reports a render exception that removes the chrome as that step\'s page error', async () => {
    await expect(run(new FakePage(5, { crashAt: 3 }))).rejects.toMatchObject({
      phase: 'render',
      step: 3,
      message: 'page error: render exploded',
    })
  })

  it('fails when the step hooks are missing', async () => {
    await expect(run(new FakePage(3, { noChrome: true }))).rejects.toMatchObject({ phase: 'render', step: 0 })
  })
})
