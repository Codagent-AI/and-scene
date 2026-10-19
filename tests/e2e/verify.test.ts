import { afterAll, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

// E2E-001 and E2E-002 for scripts/verify.mjs. Browser-backed; run via `npm run test:integration -- tests/e2e`.

const REPO = process.cwd()
const SLUG = 'how-to-make-a-presentation'
const SAMPLE_CAPTION_TAIL = 'Thanks for watching.'
const EXCLUDED = new Set(['.git', 'dist', '.inspection', 'node_modules'])
const copies: string[] = []

interface RunResult {
  status: number | null
  output: string
}

function runIn(root: string, command: string, args: string[], timeout = 280_000): RunResult {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, VERIFY_ROOT: root },
    timeout,
    shell: process.platform === 'win32',
  })
  return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

const runVerify = (root: string, extra: string[] = []) =>
  runIn(root, process.execPath, [path.join(root, 'scripts', 'verify.mjs'), ...extra])

/** Disposable copy of the repository, sharing the installed node_modules. */
function makeCopy(name: string): string {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), `and-scene-${name}-`))
  copies.push(dest)
  fs.cpSync(REPO, dest, {
    recursive: true,
    filter: (src) => {
      const top = path.relative(REPO, src).split(path.sep)[0]
      return !EXCLUDED.has(top)
    },
  })
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dest, 'node_modules'), 'dir')
  return dest
}

/** Replaces `needle` with `replacement` in one file; throws if the anchor is absent so a fault can never silently no-op. */
function mutate(root: string, relFile: string, needle: string, replacement: string) {
  const file = path.join(root, relFile)
  const text = fs.readFileSync(file, 'utf8')
  if (!text.includes(needle)) throw new Error(`fault anchor not found in ${relFile}`)
  fs.writeFileSync(file, text.replace(needle, replacement))
}

/** Replaces `needle` in every source file under a directory. */
function mutateTree(root: string, relDir: string, needle: string, replacement: string): number {
  let hits = 0
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(tsx?|ts)$/.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8')
        if (text.includes(needle)) {
          fs.writeFileSync(full, text.split(needle).join(replacement))
          hits += text.split(needle).length - 1
        }
      }
    }
  }
  walk(path.join(root, relDir))
  if (hits === 0) throw new Error(`fault anchor "${needle}" not found under ${relDir}`)
  return hits
}

function previewPort(output: string): number | null {
  const match = /verify: preview http:\/\/127\.0\.0\.1:(\d+)/.exec(output)
  return match ? Number(match[1]) : null
}

function previewPid(output: string): number | null {
  const match = /verify: preview pid (\d+)/.exec(output)
  return match ? Number(match[1]) : null
}

function portAccepts(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Asserts the preview started by a run is gone: its port refuses connections and its process no longer exists. */
async function expectPreviewCleaned(output: string) {
  const port = previewPort(output)
  const pid = previewPid(output)
  expect(port, 'run should have started a preview').not.toBeNull()
  expect(pid, 'run should have reported the preview pid').not.toBeNull()
  // Give the kernel a moment to release the socket after the process group exits.
  for (let i = 0; i < 20 && (await portAccepts(port!)); i++) await new Promise((r) => setTimeout(r, 100))
  expect(await portAccepts(port!)).toBe(false)
  expect(pidAlive(pid!)).toBe(false)
  // No descendant of the preview (vite's node process, esbuild service) may survive either.
  const survivors = spawnSync('ps', ['-eo', 'pid,args'], { encoding: 'utf8' })
    .stdout.split('\n')
    .filter((line) => line.includes(`--port ${port}`) && !line.includes('ps -eo'))
  expect(survivors, 'preview process tree should be gone').toEqual([])
}

function expectFailure(result: RunResult, phase: string, step: number | null) {
  expect(result.status).not.toBe(0)
  expect(result.output).not.toContain('verify: PASS')
  const stepText = step === null ? '-' : String(step)
  expect(result.output).toContain(`verify: FAIL phase=${phase} step=${stepText} `)
}

afterAll(() => {
  for (const dest of copies) {
    try {
      fs.unlinkSync(path.join(dest, 'node_modules'))
    } catch {
      // Already gone.
    }
    fs.rmSync(dest, { recursive: true, force: true })
  }
})

describe('E2E-001: reference presentation passes production verification', () => {
  it('npm run verify exits zero with a PASS line, 127.0.0.1 preview, and all nine steps', async () => {
    const result = runIn(REPO, 'npm', ['run', 'verify'], 500_000)
    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain('verify: build ok')
    expect(result.output).toContain('verify: sample ok')
    expect(result.output).toMatch(/verify: preview http:\/\/127\.0\.0\.1:\d+/)
    expect(result.output).not.toContain('localhost')
    expect(result.output).toContain('verify: PASS')

    const config = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts', 'verify.config.json'), 'utf8')) as {
      slug: string
      steps: { title: string }[]
    }
    expect(config.slug).toBe(SLUG)
    const observed = [...result.output.matchAll(/verify: step (\d+) rendered: (.*)$/gm)]
    expect(observed.map((m) => Number(m[1]))).toEqual(config.steps.map((_, i) => i))
    observed.forEach((m, i) => expect(m[2]).toBe(JSON.stringify(config.steps[i].title)))
    expect(result.output).toContain('verify: transition ok')
    expect(result.output).not.toMatch(/verify: FAIL/)
    await expectPreviewCleaned(result.output)
  }, 500_000)
})

describe('E2E-002: verification failures are actionable', () => {
  it('a type error in an index-level presentation file fails the build phase', async () => {
    const root = makeCopy('build-fault')
    mutate(root, 'src/presentations/index.ts', 'export const presentations', "export const brokenForVerify: number = 'not a number'\nexport const presentations")
    const result = runVerify(root)
    expectFailure(result, 'build', null)
    expect(result.output).not.toContain('verify: build ok')
    expect(result.output).toContain('src/presentations/index.ts(')
  }, 300_000)

  it('an unregistered sample fails the sample phase', async () => {
    const root = makeCopy('unregistered')
    fs.writeFileSync(
      path.join(root, 'src', 'presentations', 'index.ts'),
      'import type { PresentationEntry } from \'./registry\'\nexport const presentations: readonly PresentationEntry[] = []\n',
    )
    expect(runIn(root, process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']).status).toBe(0)
    const result = runVerify(root, ['--skip-build'])
    expectFailure(result, 'sample', null)
    expect(result.output).toContain(SLUG)
  }, 300_000)

  it('a changed normative caption fails the render phase at the offending step', async () => {
    const root = makeCopy('caption')
    mutateTree(root, 'src/presentations/how-to-make-a-presentation', SAMPLE_CAPTION_TAIL, 'Thanks, all.')
    expect(runIn(root, process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']).status).toBe(0)
    const result = runVerify(root, ['--skip-build'])
    expectFailure(result, 'render', 8)
    expect(result.output).toContain('caption is')
    await expectPreviewCleaned(result.output)
  }, 300_000)

  it('out-of-order normative steps fail the render phase at the first mismatched step', async () => {
    const root = makeCopy('order')
    const configPath = path.join(root, 'scripts', 'verify.config.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { steps: unknown[] }
    const [a, b] = [config.steps[1], config.steps[2]]
    config.steps[1] = b
    config.steps[2] = a
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    expect(runIn(root, process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']).status).toBe(0)
    const result = runVerify(root, ['--skip-build'])
    expectFailure(result, 'render', 1)
    await expectPreviewCleaned(result.output)
  }, 300_000)

  it('a step that emits console.error fails the render phase at that step', async () => {
    const root = makeCopy('console')
    mutate(
      root,
      'src/presentation-kit/Presentation.tsx',
      'const step = steps[nav.index]',
      "const step = steps[nav.index]\n  if (nav.index === 2) console.error('fault: step 2 console error')",
    )
    expect(runIn(root, process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']).status).toBe(0)
    const result = runVerify(root, ['--skip-build'])
    expectFailure(result, 'render', 2)
    expect(result.output).toContain('console.error: fault: step 2 console error')
    await expectPreviewCleaned(result.output)
  }, 300_000)

  it('an uncaught page error at a step fails the render phase at that step', async () => {
    const root = makeCopy('pageerror')
    mutate(
      root,
      'src/presentation-kit/Presentation.tsx',
      'const step = steps[nav.index]',
      "const step = steps[nav.index]\n  if (nav.index === 3) setTimeout(() => { throw new Error('fault: step 3 uncaught') }, 0)",
    )
    expect(runIn(root, process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']).status).toBe(0)
    const result = runVerify(root, ['--skip-build'])
    expectFailure(result, 'render', 3)
    expect(result.output).toContain('uncaught page error: fault: step 3 uncaught')
    await expectPreviewCleaned(result.output)
  }, 300_000)

  it('a synchronous render crash at the destination step fails the render phase at that step', async () => {
    const root = makeCopy('rendercrash')
    mutate(
      root,
      'src/presentation-kit/Presentation.tsx',
      'const step = steps[nav.index]',
      "const step = steps[nav.index]\n  if (nav.index === 5) throw new Error('fault: step 5 render crash')",
    )
    expect(runIn(root, process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']).status).toBe(0)
    const result = runVerify(root, ['--skip-build'])
    expectFailure(result, 'render', 5)
    expect(result.output).toContain('fault: step 5 render crash')
    await expectPreviewCleaned(result.output)
  }, 300_000)

  it('a navigation that ignores ArrowRight at step 4 fails the transition phase at step 4', async () => {
    const root = makeCopy('transition')
    mutate(
      root,
      'src/presentation-kit/usePresentationNav.ts',
      'e.preventDefault()\n      setIndex((i) => clampIndex(i + delta, count))',
      'e.preventDefault()\n      setIndex((i) => (i === 4 && delta === 1 ? i : clampIndex(i + delta, count)))',
    )
    expect(runIn(root, process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']).status).toBe(0)
    const result = runVerify(root, ['--skip-build'])
    expectFailure(result, 'transition', 4)
    await expectPreviewCleaned(result.output)
  }, 300_000)

  it('a missing dist fails before readiness and still leaves no preview behind', async () => {
    const root = makeCopy('no-dist')
    fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true })
    const result = runVerify(root, ['--skip-build'])
    expectFailure(result, 'render', null)
    await expectPreviewCleaned(result.output)
  }, 300_000)
})
