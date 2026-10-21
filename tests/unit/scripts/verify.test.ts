import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  checkRegistry, checkTransition, createErrorCollector, loadOutline, loadOutlines, renderSteps, validateOutline, verify,
  type FakePage, type VerifyDeps,
} from '../../../scripts/verify.mjs'
import { SPEC_SLUG, SPEC_STEPS, SPEC_TITLE } from '../../helpers/spec-outline.ts'


const outline = {
  slug: 'demo',
  title: 'Demo',
  steps: [
    { era: 'a', title: 'One', caption: 'First.' },
    { era: 'a', title: 'Two', caption: 'Second.' },
    { era: 'b', title: 'Three', caption: 'Third.' },
  ],
}

function tmpProject(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'verify-unit-'))
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(root, name, '..'), { recursive: true })
    writeFileSync(join(root, name), content)
  }
  return root
}

const phaseOf = async (fn: () => unknown) => {
  try {
    await fn()
  } catch (error) {
    return error as Error & { phase: string }
  }
  throw new Error('expected a failure')
}

describe('outline data', () => {
  it('accepts a well-formed outline', () => {
    expect(validateOutline(outline)).toBe(outline)
  })

  it.each([
    ['null', null],
    ['no slug', { ...outline, slug: '' }],
    ['no title', { ...outline, title: undefined }],
    ['no steps', { ...outline, steps: [] }],
    ['blank caption', { ...outline, steps: [{ era: 'a', title: 't', caption: '  ' }] }],
    ['missing era', { ...outline, steps: [{ title: 't', caption: 'c' }] }],
  ])('rejects %s', async (_name, bad) => {
    const error = await phaseOf(() => validateOutline(bad))
    expect(error.phase).toBe('outline')
    expect(error.message).toContain('malformed')
  })

  it('reads the data file from the project it is run in', () => {
    const root = tmpProject({ 'scripts/verify.config.json': JSON.stringify(outline) })
    expect(loadOutline(root).slug).toBe('demo')
  })

  it('accepts several presentations in one data file, validating each', async () => {
    const other = { ...outline, slug: 'other' }
    const root = tmpProject({ 'scripts/verify.config.json': JSON.stringify({ presentations: [outline, other] }) })
    expect(loadOutlines(root).map((o) => o.slug)).toEqual(['demo', 'other'])
    const bad = tmpProject({ 'scripts/verify.config.json': JSON.stringify({ presentations: [outline, { ...other, steps: [] }] }) })
    expect((await phaseOf(() => loadOutlines(bad))).phase).toBe('outline')
    const empty = tmpProject({ 'scripts/verify.config.json': JSON.stringify({ presentations: [] }) })
    expect((await phaseOf(() => loadOutlines(empty))).phase).toBe('outline')
  })

  it('fails the outline phase when the file is missing or not JSON', async () => {
    const missing = await phaseOf(() => loadOutline(tmpProject({})))
    expect([missing.phase, missing.message]).toEqual(['outline', expect.stringContaining('missing')])
    const broken = await phaseOf(() => loadOutline(tmpProject({ 'scripts/verify.config.json': '{nope' })))
    expect(broken.phase).toBe('outline')
    expect(broken.message).toContain('not valid JSON')
  })

  it('enforces the canonical nine-step sample in the repository', () => {
    const loaded = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'verify.config.json'), 'utf8'))
    expect(loaded.slug).toBe(SPEC_SLUG)
    expect(loaded.title).toBe(SPEC_TITLE)
    expect(loaded.steps.map((s: { era: string; title: string; caption: string }) => [s.era, s.title, s.caption])).toEqual(SPEC_STEPS.map((r) => [...r]))
  })
})

describe('registry check', () => {
  const index = (slug: string, load = './demo/Talk.tsx') =>
    `export const PRESENTATIONS = [\n  { slug: '${slug}', title: 'x', load: () => import('${load}') },\n]\n`

  it('passes when the slug is registered and its entry file exists', () => {
    const root = tmpProject({ 'src/presentations/index.ts': index('demo'), 'src/presentations/demo/Talk.tsx': 'x' })
    expect(() => checkRegistry(root, outline)).not.toThrow()
  })

  it.each([
    ['index missing', {}, 'missing src/presentations/index.ts'],
    ['slug not registered', { 'src/presentations/index.ts': index('other'), 'src/presentations/other/Talk.tsx': 'x' }, 'not registered'],
    ['sample entry file missing', { 'src/presentations/index.ts': index('demo') }, 'missing its entry file'],
  ])('fails in the registry phase when %s', async (_name, files, message) => {
    const error = await phaseOf(() => checkRegistry(tmpProject(files), outline))
    expect([error.phase, error.message]).toEqual(['registry', expect.stringContaining(message)])
  })
})

describe('transition check', () => {
  it('accepts the expected next index', () => {
    expect(() => checkTransition(0, 1, 1)).not.toThrow()
  })

  it.each([[1, 'unchanged'], [3, 'skipped ahead'], [0, 'went back']])('rejects landing on %i (%s)', async (landed) => {
    const error = await phaseOf(() => checkTransition(1, landed, 2))
    expect(error.phase).toBe('transition')
    expect(error.message).toContain('step 2')
    expect(error.message).toContain(`${landed}`)
  })
})

type Handler = (arg: never) => void
function fakePage(script: { indexes?: number[]; era?: (i: number) => string; title?: (i: number) => string; caption?: (i: number) => string; count?: number; mode?: string; onPress?: (i: number) => void; stall?: number } = {}) {
  const handlers: Record<string, Handler> = {}
  let index = 0
  const page = {
    on: (event: string, handler: Handler) => (handlers[event] = handler),
    goto: vi.fn<(url: string, options?: unknown) => Promise<undefined>>(async () => undefined),
    waitForSelector: vi.fn(async () => undefined),
    waitForTimeout: vi.fn<(ms: number) => Promise<void>>(async () => undefined),
    getAttribute: vi.fn(async (_selector: string, name: string) =>
      name === 'data-step-count' ? String(script.count ?? 3)
        : name === 'data-presentation-mode' ? (script.mode ?? 'browse')
          : String(index)),
    textContent: vi.fn(async (selector: string) =>
      selector.includes('era') ? (script.era?.(index) ?? outline.steps[index].era)
        : selector.includes('title') ? (script.title?.(index) ?? outline.steps[index].title) : (script.caption?.(index) ?? outline.steps[index].caption)),
    keyboard: { press: vi.fn(async () => { script.onPress?.(index) }) },
    waitForFunction: vi.fn(async (_fn: unknown, expected: number) => {
      if (script.stall === index) throw new Error('timeout')
      index = expected
    }),
  }
  return { page, emit: (event: string, arg: unknown) => handlers[event]?.(arg as never), step: () => index }
}

describe('error collection', () => {
  const consoleMessage = (type: string, text: string) => ({ type: () => type, text: () => text })

  it('records console.error and uncaught page errors against the current step, ignoring other console output', () => {
    const { page, emit } = fakePage()
    let current = 4
    const collector = createErrorCollector(page, () => current)
    emit('console', consoleMessage('log', 'hello'))
    emit('console', consoleMessage('warning', 'careful'))
    expect(collector.errors).toEqual([])
    expect(() => collector.assertClean()).not.toThrow()
    emit('console', consoleMessage('error', 'boom'))
    current = 7
    emit('pageerror', new Error('uncaught'))
    expect(collector.errors).toEqual([
      { step: 4, kind: 'console.error', text: 'boom' },
      { step: 7, kind: 'pageerror', text: 'uncaught' },
    ])
    expect(() => collector.assertClean()).toThrow(/step 5: console\.error: boom/)
  })
})

describe('renderSteps', () => {
  const run = (script?: Parameters<typeof fakePage>[0]) => {
    const fake = fakePage(script)
    return { fake, result: () => renderSteps(fake.page as unknown as FakePage, outline, 'http://127.0.0.1:1234') }
  }

  it('visits every step through the public hooks and navigates by ArrowRight', async () => {
    const { fake, result } = run()
    expect(await result()).toBe(3)
    expect(fake.page.goto).toHaveBeenCalledWith('http://127.0.0.1:1234/demo', expect.anything())
    expect(fake.page.keyboard.press).toHaveBeenCalledTimes(2)
    expect(fake.page.keyboard.press).toHaveBeenCalledWith('ArrowRight')
  })

  it('catches an error emitted on the last step after the final settle', async () => {
    const { fake, result } = run({
      onPress: () => undefined,
    })
    fake.page.waitForTimeout = vi.fn(async (ms: number) => {
      if (ms === 500) fake.emit('pageerror', new Error('late'))
    })
    const error = await phaseOf(result)
    expect([error.phase, error.message]).toEqual(['render', expect.stringContaining('step 3: pageerror: late')])
  })

  it('names the step whose console error fires, even when raised while navigating (listener installed before goto)', async () => {
    const { fake, result } = run()
    fake.page.goto = vi.fn(async () => { fake.emit('console', { type: () => 'error', text: () => 'early' }) })
    const error = await phaseOf(result)
    expect(error.message).toContain('step 1: console.error: early')
  })

  it('attributes an error raised while the next step renders to that step, and logs each step it passes', async () => {
    const lines: string[] = []
    const fake = fakePage({ onPress: (i) => { if (i === 0) fake.emit('console', { type: () => 'error', text: () => 'during transition' }) } })
    const error = await phaseOf(() => renderSteps(fake.page as unknown as FakePage, outline, 'http://127.0.0.1:1', (line) => lines.push(line)))
    expect(error.message).toContain('step 2: console.error: during transition')
    expect(lines).toEqual(['verify: opening http://127.0.0.1:1/demo'])
    const ok = fakePage()
    await renderSteps(ok.page as unknown as FakePage, outline, 'http://127.0.0.1:1', (line) => lines.push(line))
    expect(lines.slice(1)).toEqual([
      'verify: opening http://127.0.0.1:1/demo',
      'verify: step 1/3 (data-step-index=0) "One" ok',
      'verify: step 2/3 (data-step-index=1) "Two" ok',
      'verify: step 3/3 (data-step-index=2) "Three" ok',
    ])
  })

  it('fails when a transition does not advance the public step index', async () => {
    const { result } = run({ stall: 1 })
    const error = await phaseOf(result)
    expect(error.phase).toBe('transition')
    expect(error.message).toContain('step 2')
  })

  it.each([
    ['era', { era: () => 'wrong era' }, 'step 1: era "wrong era" does not match "a"'],
    ['title', { title: () => 'Wrong' }, 'step 1: title "Wrong"'],
    ['caption', { caption: () => 'Wrong' }, 'step 1: caption does not match'],
    ['step count', { count: 5 }, 'expected 3 steps'],
    ['mode', { mode: 'present' }, 'browse mode'],
  ])('fails on a mismatched %s', async (_name, script, message) => {
    const error = await phaseOf(run(script).result)
    expect([error.phase, error.message]).toEqual(['render', expect.stringContaining(message)])
  })
})

describe('verify orchestration', () => {
  const root = () => tmpProject({
    'scripts/verify.config.json': JSON.stringify(outline),
    'src/presentations/index.ts': "export const P = [{ slug: 'demo', load: () => import('./demo/Talk.tsx') }]",
    'src/presentations/demo/Talk.tsx': 'x',
  })
  const deps = (over: Record<string, unknown> = {}) => {
    const stop = vi.fn(async () => undefined)
    const close = vi.fn(async () => undefined)
    return {
      stop, close,
      deps: {
        runBuild: vi.fn(async () => ''),
        startPreview: vi.fn(async () => ({ port: 4321, stop })),
        launchBrowser: vi.fn(async () => ({ close, newPage: async () => fakePage({ count: 3 }).page })),
        ...over,
      },
    }
  }
  const call = (r: string, d: unknown) => verify(r, () => undefined, d as VerifyDeps)

  it('runs the phases in order and cleans up on success', async () => {
    const { deps: d, stop, close } = deps()
    await call(root(), d)
    expect(d.runBuild).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledOnce()
  })

  it('never builds or launches a browser when the outline or registry is bad', async () => {
    const { deps: d } = deps()
    const noRegistry = tmpProject({ 'scripts/verify.config.json': JSON.stringify(outline), 'src/presentations/index.ts': 'export const P = []' })
    expect((await phaseOf(() => call(noRegistry, d))).phase).toBe('registry')
    expect((await phaseOf(() => call(tmpProject({}), d))).phase).toBe('outline')
    expect(d.runBuild).not.toHaveBeenCalled()
    expect(d.startPreview).not.toHaveBeenCalled()
  })

  it('skips the browser phase and propagates a build failure', async () => {
    const { deps: d } = deps({ runBuild: vi.fn(async () => { throw Object.assign(new Error('tsc failed'), { phase: 'build' }) }) })
    expect((await phaseOf(() => call(root(), d))).phase).toBe('build')
    expect(d.startPreview).not.toHaveBeenCalled()
    expect(d.launchBrowser).not.toHaveBeenCalled()
  })

  it('stops the preview when the browser cannot launch', async () => {
    const { deps: d, stop } = deps({ launchBrowser: vi.fn(async () => { throw new Error('no chromium') }) })
    await expect(call(root(), d)).rejects.toThrow('no chromium')
    expect(stop).toHaveBeenCalledOnce()
  })

  it('closes the browser and stops the preview when rendering fails', async () => {
    const close = vi.fn(async () => undefined)
    const { deps: d, stop } = deps({
      launchBrowser: vi.fn(async () => ({ close, newPage: async () => fakePage({ count: 9 }).page })),
    })
    await expect(call(root(), d)).rejects.toThrow('expected 3 steps')
    expect(close).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledOnce()
  })

  it('still stops the preview when closing the browser fails', async () => {
    const close = vi.fn(async () => { throw new Error('close failed') })
    const { deps: d, stop } = deps({
      launchBrowser: vi.fn(async () => ({ close, newPage: async () => fakePage({ count: 3 }).page })),
    })
    await expect(call(root(), d)).rejects.toThrow('close failed')
    expect(close).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledOnce()
  })

  it('verifies every presentation in the data file, each on its own page', async () => {
    const dir = tmpProject({
      'scripts/verify.config.json': JSON.stringify({ presentations: [outline, { ...outline, slug: 'other' }] }),
      'src/presentations/index.ts': "export const P = [{ slug: 'demo', load: () => import('./demo/Talk.tsx') }, { slug: 'other', load: () => import('./other/Talk.tsx') }]",
      'src/presentations/demo/Talk.tsx': 'x',
      'src/presentations/other/Talk.tsx': 'x',
    })
    const pages: ReturnType<typeof fakePage>[] = []
    const { deps: d } = deps({
      launchBrowser: vi.fn(async () => ({ close: async () => undefined, newPage: async () => { const f = fakePage({ count: 3 }); pages.push(f); return f.page } })),
    })
    await call(dir, d)
    expect(pages.map((p) => p.page.goto.mock.calls[0][0])).toEqual(['http://127.0.0.1:4321/demo', 'http://127.0.0.1:4321/other'])
  })
})
