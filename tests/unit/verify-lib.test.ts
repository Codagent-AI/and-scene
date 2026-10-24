import { mkdtempSync, writeFileSync, cpSync, rmSync, symlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { driveSteps } from '../../scripts/lib/step-driver.mjs'
import { formatFailure, formatPass, VerifyError } from '../../scripts/lib/report.mjs'
import { validateRendered } from '../../scripts/lib/outline.mjs'
import { runVerify } from '../../scripts/lib/verify-core.mjs'
import { LOOPBACK_HOST, freePort, originOf, waitForReady } from '../../scripts/lib/loopback.mjs'
import { readConfig } from '../../scripts/lib/config.mjs'

const noSleep = () => Promise.resolve()
const outline = Array.from({ length: 4 }, (_, i) => ({ era: `era${i}`, title: `T${i}`, caption: `C${i}` }))

type Hooks = { count: number; index: number; title?: string; caption?: string; era?: string } | null

/** A scripted stand-in for the Playwright page surface the driver uses. */
function fakePage(opts: {
  count?: number
  stallAt?: number
  errorOnIndex?: Record<number, { kind: 'console' | 'pageerror'; text: string }>
  errorOnGoto?: string
  noHooks?: boolean
  gotoFails?: boolean
  countAfter?: number
  titles?: string[]
} = {}) {
  const count = opts.count ?? 4
  const handlers: Record<string, ((arg: unknown) => void)[]> = {}
  const emit = (event: string, arg: unknown) => handlers[event]?.forEach((h) => h(arg))
  let index = 0
  const fire = (i: number) => {
    const e = opts.errorOnIndex?.[i]
    if (e?.kind === 'console') emit('console', { type: () => 'error', text: () => e.text })
    if (e?.kind === 'pageerror') emit('pageerror', new Error(e.text))
  }
  const page = {
    on: (event: string, h: (arg: unknown) => void) => void (handlers[event] ??= []).push(h),
    goto: async () => {
      if (opts.gotoFails) throw new Error('net::ERR_CONNECTION_REFUSED')
      if (opts.errorOnGoto) emit('console', { type: () => 'error', text: () => opts.errorOnGoto })
      fire(0)
    },
    evaluate: async (): Promise<Hooks> => {
      if (opts.noHooks) return null
      return {
        count: index > 0 && opts.countAfter ? opts.countAfter : count,
        index,
        title: opts.titles?.[index] ?? `T${index}`,
        caption: `C${index}`,
        era: `era${index}`,
      }
    },
    keyboard: {
      press: async (key: string) => {
        expect(key).toBe('ArrowRight')
        if (opts.stallAt === index) return
        index += 1
        fire(index)
      },
    },
  }
  return page
}

const drive = (page: ReturnType<typeof fakePage>, extra = {}) =>
  driveSteps(page, 'http://127.0.0.1:1/x', { outline, timeoutMs: 15, stepSettleMs: 0, sleep: noSleep, ...extra })

const failure = async (p: Promise<unknown>) => {
  try {
    await p
  } catch (e) {
    return e as InstanceType<typeof VerifyError>
  }
  throw new Error('expected a failure')
}

describe('validateRendered', () => {
  const ok = outline.map((o, i) => ({ index: i, ...o }))
  it('accepts a matching render', () => expect(validateRendered(ok, outline)).toEqual([]))
  it('ignores era when none was rendered', () =>
    expect(validateRendered(ok.map((r) => ({ ...r, era: undefined })), outline)).toEqual([]))
  it('reports a different step count', () => {
    expect(validateRendered(ok.slice(0, 3), outline)[0]).toMatch(/expected 4 steps but rendered 3/)
    expect(validateRendered([...ok, ok[0]], outline)[0]).toMatch(/expected 4 steps but rendered 5/)
  })
  it.each(['title', 'caption', 'era'] as const)('reports a changed %s with its step number', (field) => {
    const bad = ok.map((r, i) => (i === 2 ? { ...r, [field]: 'other' } : r))
    const problems = validateRendered(bad, outline)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(new RegExp(`^step 3 ${field}:`))
  })
  it('reports reordered steps', () => {
    const swapped = [ok[1], ok[0], ok[2], ok[3]]
    expect(validateRendered(swapped, outline).length).toBeGreaterThanOrEqual(2)
  })
})

describe('driveSteps', () => {
  it('steps through every step and returns what was rendered', async () => {
    const result = await drive(fakePage())
    expect(result.count).toBe(4)
    expect(result.rendered.map((r: { index: number }) => r.index)).toEqual([0, 1, 2, 3])
    expect(result.rendered.map((r: { title: string }) => r.title)).toEqual(['T0', 'T1', 'T2', 'T3'])
  })

  it('fails with the sample phase when the rendered steps differ from the outline', async () => {
    const err = await failure(drive(fakePage({ titles: ['T0', 'T1', 'Other', 'T3'] })))
    expect(err).toMatchObject({ phase: 'sample' })
    expect(err.message).toMatch(/step 3 title/)
  })

  it('attributes a console error during the first load to step index 0', async () => {
    const err = await failure(drive(fakePage({ errorOnGoto: 'boom' })))
    expect(err).toMatchObject({ phase: 'render', step: 0 })
    expect(err.message).toContain('console.error: boom')
  })

  it.each([
    ['console', 'bad console'],
    ['pageerror', 'bad throw'],
  ] as const)('attributes a %s error raised on a later transition to that step', async (kind, text) => {
    const err = await failure(drive(fakePage({ errorOnIndex: { 2: { kind, text } } })))
    expect(err).toMatchObject({ phase: 'render', step: 2 })
    expect(err.message).toContain(text)
  })

  it('catches an error raised by the first step itself', async () => {
    const err = await failure(drive(fakePage({ errorOnIndex: { 0: { kind: 'pageerror', text: 'first' } } })))
    expect(err).toMatchObject({ phase: 'render', step: 0 })
  })

  it('catches an error raised on the final step', async () => {
    const err = await failure(drive(fakePage({ errorOnIndex: { 3: { kind: 'console', text: 'last' } } })))
    expect(err).toMatchObject({ phase: 'render', step: 3 })
  })

  it('ignores non-error console output', async () => {
    const page = fakePage()
    const warn = vi.fn()
    page.on('console', warn)
    await expect(drive(page)).resolves.toBeTruthy()
  })

  it('fails when a transition does not advance the step index', async () => {
    const err = await failure(drive(fakePage({ stallAt: 1 })))
    expect(err).toMatchObject({ phase: 'render', step: 2 })
    expect(err.message).toMatch(/did not advance/)
  })

  it('fails when the presentation hooks are missing', async () => {
    const err = await failure(drive(fakePage({ noHooks: true })))
    expect(err).toMatchObject({ phase: 'render', step: 0 })
    expect(err.message).toMatch(/no presentation step hooks/)
  })

  it('fails when the step count changes while stepping', async () => {
    const err = await failure(drive(fakePage({ countAfter: 6 })))
    expect(err.message).toMatch(/step count changed from 4 to 6/)
  })

  it('fails when the route cannot be opened', async () => {
    const err = await failure(drive(fakePage({ gotoFails: true })))
    expect(err).toMatchObject({ phase: 'render', step: 0 })
    expect(err.message).toMatch(/could not open .*ERR_CONNECTION_REFUSED/)
  })
})

describe('reporting', () => {
  it('names the phase, and the step index when there is one', () => {
    expect(formatFailure(new VerifyError('build', 'tsc failed'))).toBe('verify: FAIL [build] tsc failed')
    expect(formatFailure(new VerifyError('render', 'oops', { step: 0 }))).toBe('verify: FAIL [render, step index 0] oops')
    expect(formatFailure(new Error('weird'))).toBe('verify: FAIL [unexpected] weird')
  })
  it('reports a clear pass with route and step counts', () => {
    expect(formatPass([{ slug: 'a', count: 9 }])).toBe('verify: PASS (build ok; a: 9 steps)')
  })
})

function fakeDeps(over: { buildOk?: boolean; previewFails?: boolean; browserFails?: boolean; registered?: boolean; driveFails?: boolean } = {}) {
  const calls: string[] = []
  const deps = {
    build: async () => (calls.push('build'), { ok: over.buildOk ?? true, output: 'tsc: error TS1' }),
    startPreview: async () => {
      calls.push('preview:start')
      if (over.previewFails) throw new Error('port busy')
      return { origin: 'http://127.0.0.1:9', stop: async () => void calls.push('preview:stop') }
    },
    launchBrowser: async () => {
      calls.push('browser:launch')
      if (over.browserFails) throw new Error('no chromium')
      return {
        newContext: async () => ({
          newPage: async () => ({ goto: async () => {}, evaluate: async () => over.registered ?? true }),
          close: async () => void calls.push('context:close'),
        }),
        close: async () => void calls.push('browser:close'),
      }
    },
    driveSteps: async () => {
      calls.push('drive')
      if (over.driveFails) throw new VerifyError('render', 'bad', { step: 2 })
      return { count: 9, rendered: [] }
    },
  }
  return { calls, deps }
}
const config = { routes: [{ slug: 'demo' }] }
const run = (deps: object) => runVerify({ root: '/x', config, log: () => {}, deps })

describe('runVerify', () => {
  it('builds, serves, drives each route, and shuts everything down on success', async () => {
    const { calls, deps } = fakeDeps()
    await expect(run(deps)).resolves.toEqual([{ slug: 'demo', count: 9 }])
    expect(calls).toEqual(['build', 'preview:start', 'browser:launch', 'drive', 'context:close', 'browser:close', 'preview:stop'])
  })

  it('fails in the build phase without starting a preview', async () => {
    const { calls, deps } = fakeDeps({ buildOk: false })
    const err = await failure(run(deps))
    expect(err).toMatchObject({ phase: 'build' })
    expect(err.message).toContain('tsc: error TS1')
    expect(calls).toEqual(['build'])
  })

  it('fails in the preview phase when the server cannot start', async () => {
    const { calls, deps } = fakeDeps({ previewFails: true })
    expect(await failure(run(deps))).toMatchObject({ phase: 'preview' })
    expect(calls).not.toContain('browser:launch')
  })

  it('stops the preview when the browser cannot launch', async () => {
    const { calls, deps } = fakeDeps({ browserFails: true })
    expect(await failure(run(deps))).toMatchObject({ phase: 'browser' })
    expect(calls).toContain('preview:stop')
  })

  it('fails in the sample phase, without stepping, when the route is not registered', async () => {
    const { calls, deps } = fakeDeps({ registered: false })
    const err = await failure(run(deps))
    expect(err).toMatchObject({ phase: 'sample' })
    expect(err.message).toContain('"demo" is not registered')
    expect(calls).not.toContain('drive')
    expect(calls.slice(-3)).toEqual(['context:close', 'browser:close', 'preview:stop'])
  })

  it('names the failing step and still cleans up when stepping fails', async () => {
    const { calls, deps } = fakeDeps({ driveFails: true })
    expect(await failure(run(deps))).toMatchObject({ phase: 'render', step: 2 })
    expect(calls.slice(-3)).toEqual(['context:close', 'browser:close', 'preview:stop'])
  })
})

describe('verify entry point', () => {
  it('exits non-zero and names the failure when the configuration is unusable', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'verify-exit-'))
    try {
      cpSync('scripts', path.join(dir, 'scripts'), { recursive: true })
      symlinkSync(path.resolve('node_modules'), path.join(dir, 'node_modules'))
      const out = spawnSync(process.execPath, [path.join(dir, 'scripts/verify.mjs')], { cwd: os.tmpdir(), encoding: 'utf8' })
      expect(out.status).toBe(1)
      expect(out.stderr).toMatch(/^verify: FAIL \[unexpected\]/)
      expect(out.stdout).not.toMatch(/PASS/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('config and loopback helpers', () => {
  it('reads routes from the project root, not the working directory', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'verify-cfg-'))
    try {
      writeFileSync(path.join(dir, 'verify.config.json'), JSON.stringify({ routes: [{ slug: 'a' }] }))
      expect((await readConfig(dir)).routes[0].slug).toBe('a')
      writeFileSync(path.join(dir, 'verify.config.json'), JSON.stringify({ routes: [] }))
      await expect(readConfig(dir)).rejects.toThrow(/at least one route/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('uses the IPv4 loopback address for origins and free ports', async () => {
    expect(LOOPBACK_HOST).toBe('127.0.0.1')
    expect(originOf(4173)).toBe('http://127.0.0.1:4173')
    const port = await freePort()
    await new Promise<void>((resolve, reject) => {
      const s = net.createServer().once('error', reject).listen(port, LOOPBACK_HOST, () => s.close(() => resolve()))
    })
  })

  it('waits for readiness, retrying until the URL answers', async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValue({ ok: true })
    await waitForReady('http://127.0.0.1:1/', { fetchFn, sleep: noSleep })
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })

  it('gives up with the last failure after the timeout', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(waitForReady('http://127.0.0.1:1/', { fetchFn, sleep: noSleep, timeoutMs: 10 })).rejects.toThrow(/not ready after 10ms \(ECONNREFUSED\)/)
  })
})
