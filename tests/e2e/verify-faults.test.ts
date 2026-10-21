// E2E-002: verification failures are actionable. One fault per verification phase,
// each applied to its own throwaway copy of the app.
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { ROOT, cleanupTempDirs, copyApp, isPortOpen, leftoverProcesses, linkNodeModules, previewPort, run, tempDir, type RunResult } from '../helpers'

afterAll(cleanupTempDirs)

const SAMPLE = 'src/presentations/how-to-make-a-presentation'

function edit(dir: string, file: string, change: (text: string) => string) {
  const path = join(dir, file)
  const before = readFileSync(path, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`fault did not change ${file}`)
  writeFileSync(path, after)
}

/** Registers a second presentation (a copy of the template) alongside the sample. */
function addPresentation(dir: string, slug: string) {
  const target = join(dir, 'src/presentations', slug)
  cpSync(join(ROOT, 'skills/presentation/templates/presentation'), target, { recursive: true })
  edit(dir, 'src/presentations/index.ts', (t) => t.replace(/\n\]\n$/, `\n  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk') },\n]\n`))
}

async function runFault(name: string, fault: (dir: string) => void, extraArgs: string[] = []): Promise<{ dir: string } & RunResult> {
  const dir = tempDir(`and-scene-e2e2-${name}-`)
  copyApp(dir)
  linkNodeModules(dir)
  fault(dir)
  const result = await run('npm', ['run', 'verify', '--', ...extraArgs], { cwd: dir, timeoutMs: 200_000 })
  return { dir, ...result }
}

async function expectCleanedUp(r: { dir: string; out: string }) {
  const port = previewPort(r.out)
  if (port !== null) expect(await isPortOpen(port)).toBe(false)
  expect(await leftoverProcesses(r.dir)).toEqual([])
}

function expectFailure(r: RunResult, phase: string) {
  expect(r.code, r.out).not.toBe(0)
  expect(r.out).toContain(`[verify] FAIL [${phase}]`)
  expect(r.out).not.toMatch(/\[verify\] PASS/)
}

describe('build phase', () => {
  it('fails on a type error outside the sample and never reaches the browser', async () => {
    const r = await runFault('build', (dir) => writeFileSync(join(dir, 'src/broken.ts'), "export const broken: number = 'not a number'\n"))
    expectFailure(r, 'build')
    expect(r.out).toMatch(/broken\.ts/)
    expect(r.out).not.toMatch(/\[render\]/)
    await expectCleanedUp(r)
  }, 220_000)
})

describe('sample phase', () => {
  it('fails when the reference sample is not registered', async () => {
    const r = await runFault('missing', (dir) => {
      addPresentation(dir, 'other')
      edit(dir, 'src/presentations/index.ts', (t) => t.replace(/ {2}\{\n {4}slug: 'how-to-make-a-presentation',[\s\S]*?\n {2}\},\n/, ''))
    })
    expectFailure(r, 'sample')
    expect(r.out).toMatch(/reference sample "how-to-make-a-presentation" is not registered/)
    expect(r.out).not.toMatch(/\[render\] open/)
    await expectCleanedUp(r)
  }, 220_000)

  it('fails when the sample steps are out of order, naming the step', async () => {
    const r = await runFault('reorder', (dir) =>
      edit(dir, `${SAMPLE}/steps/index.ts`, (t) => t.replace('[step01, step02, step03,', '[step01, step03, step02,')),
    )
    expectFailure(r, 'sample')
    expect(r.out).toMatch(/step 1: title is "Answers become steps"/)
    await expectCleanedUp(r)
  }, 220_000)
})

describe('render phase', () => {
  const sceneFault = (code: string, hook = true) => (dir: string) =>
    edit(dir, `${SAMPLE}/Scene.tsx`, (t) =>
      t
        .replace("import { Arrow,", `${hook ? "import { useEffect } from 'react'\n" : ''}import { Arrow,`)
        .replace('  const n = payload.step\n', `  const n = payload.step\n${code}\n`),
    )

  it('fails on a console error at a later step and identifies the step', async () => {
    const r = await runFault('console', sceneFault("  useEffect(() => { if (n === 5) console.error('boom at five') }, [n])"))
    expectFailure(r, 'render')
    expect(r.out).toMatch(/error at step 4: boom at five/)
    expect(r.out).toContain('step 4/9 ok')
    expect(r.out).not.toContain('step 5/9 ok')
    await expectCleanedUp(r)
  }, 220_000)

  it('fails on an uncaught page error at a later step and identifies the step', async () => {
    const r = await runFault('pageerror', sceneFault("  useEffect(() => { if (n === 7) setTimeout(() => { throw new Error('late failure') }, 0) }, [n])"))
    expectFailure(r, 'render')
    expect(r.out).toMatch(/error at step 6: uncaught: late failure/)
    await expectCleanedUp(r)
  }, 220_000)

  it('fails when a step throws while rendering, identifying the step', async () => {
    const r = await runFault('throw', sceneFault("  if (n === 3) throw new Error('scene exploded')", false))
    expectFailure(r, 'render')
    expect(r.out).toMatch(/error at step 2:.*scene exploded/)
    await expectCleanedUp(r)
  }, 220_000)

  it('fails when a transition never advances the step index', async () => {
    const r = await runFault(
      'stall',
      (dir) => edit(dir, 'src/presentation-kit/usePresentationNav.ts', (t) => t.replace('index: clamp(s.index + 1)', 'index: Math.min(3, clamp(s.index + 1))')),
      ['--step-timeout-ms', '1500'],
    )
    expectFailure(r, 'render')
    expect(r.out).toMatch(/transition to step 4 did not advance \(data-step-index is 3\)/)
    expect(r.out).toContain('step 4/9 ok')
    await expectCleanedUp(r)
  }, 220_000)

  it('verifies every registered presentation, so a later route fault fails after the sample passes', async () => {
    const r = await runFault('later-route', (dir) => {
      addPresentation(dir, 'other')
      edit(dir, 'src/presentations/other/Scene.tsx', (t) =>
        t.replace("import { Arrow,", "import { useEffect } from 'react'\nimport { Arrow,").replace('  const n = payload.step\n', "  const n = payload.step\n  useEffect(() => { if (n === 2) console.error('other route broke') }, [n])\n"),
      )
    })
    expectFailure(r, 'render')
    expect(r.out).toContain('how-to-make-a-presentation step 9/9 ok')
    expect(r.out).toMatch(/other: error at step 1: other route broke/)
    await expectCleanedUp(r)
  }, 220_000)
})

describe('configuration', () => {
  it('reports unknown options as a usage failure', async () => {
    const dir = tempDir('and-scene-e2e2-usage-')
    mkdirSync(dir, { recursive: true })
    copyApp(dir)
    linkNodeModules(dir)
    const r = await run('node', ['scripts/verify.mjs', '--bogus'], { cwd: dir })
    expect(r.code).not.toBe(0)
    expect(r.out).toContain('[verify] FAIL [usage]')
  })
})
