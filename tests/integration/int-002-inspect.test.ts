import { mkdirSync, readFileSync, writeFileSync, existsSync, cpSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupTmp, copyRepo, run } from '../helpers/proc'
import { ROOT } from '../helpers/spec-outline'

afterAll(cleanupTmp)

type Variant = { progress: boolean; toc: boolean; attribution: 'good' | 'small' | 'default' | 'missing'; collision: 'none' | 'unmarked' | 'allowed' }
const polished: Variant = { progress: true, toc: true, attribution: 'good', collision: 'none' }
const VARIANTS: Record<string, Variant> = {
  'fx-clean': polished,
  'fx-collision': { ...polished, collision: 'unmarked' },
  'fx-allowed': { ...polished, collision: 'allowed' },
  'fx-indistinct-progress': { ...polished, progress: false },
  'fx-indistinct-toc': { ...polished, toc: false },
  'fx-attr-small': { ...polished, attribution: 'small' },
  'fx-attr-default': { ...polished, attribution: 'default' },
  'fx-attr-missing': { ...polished, attribution: 'missing' },
}

let app: string
const warningsOf = (out: string) => out.split('\n').filter((l) => l.startsWith('WARN '))
const inspectRun = (slug: string, extra: string[] = []) =>
  run('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', ...extra], { cwd: app, timeoutMs: 120000 })

function png(file: string) {
  const bytes = readFileSync(file)
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), size: bytes.length }
}

beforeAll(async () => {
  app = copyRepo('int002')
  cpSync(path.join(ROOT, 'tests/fixtures/inspect'), path.join(app, 'src/presentations/inspect-fixture'), { recursive: true })
  const entries: string[] = []
  for (const [slug, variant] of Object.entries(VARIANTS)) {
    mkdirSync(path.join(app, 'src/presentations', slug), { recursive: true })
    writeFileSync(
      path.join(app, 'src/presentations', slug, 'Talk.tsx'),
      `import { makeTalk } from '../inspect-fixture/Fixture'\nexport default makeTalk('${slug}', ${JSON.stringify(variant)})\n`,
    )
    entries.push(`  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk') },`)
  }
  const registry = path.join(app, 'src/presentations/index.ts')
  writeFileSync(registry, readFileSync(registry, 'utf8').replace('  // presentations:end', `${entries.join('\n')}\n  // presentations:end`))
  // the fixture variants need `attribution: 'default'` to leave the link unstyled (nothing to add)
  const build = await run('npm', ['run', 'build', '--silent'], { cwd: app, timeoutMs: 300000 })
  expect(build.code, build.stdout + build.stderr).toBe(0)
})

// INT-002: the screenshot helper emits faithful artifacts and advisory warnings.
describe('INT-002: project-local screenshot helper', () => {
  it('writes one 1440x900 screenshot per step at predictable paths, waits the settle interval, and stays silent on a polished presentation', async () => {
    const result = await inspectRun('fx-clean')
    expect(result.code, result.stdout + result.stderr).toBe(0)
    const dir = path.join(app, 'inspection/fx-clean')
    for (const n of ['01', '02', '03']) {
      const shot = png(path.join(dir, `step-${n}.png`))
      expect([shot.width, shot.height]).toEqual([1440, 900])
      expect(shot.size).toBeGreaterThan(5000)
    }
    expect(existsSync(path.join(dir, 'step-04.png'))).toBe(false)
    expect(warningsOf(result.stdout)).toEqual([])
    expect(result.stdout).toContain('INSPECT fx-clean: 3 screenshot(s)')

    const report = JSON.parse(readFileSync(path.join(dir, 'report.json'), 'utf8'))
    expect(report.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/fx-clean$/)
    expect(report.steps).toHaveLength(3)
    for (const step of report.steps) {
      expect(step.elapsedMs).toBeGreaterThanOrEqual(900)
      expect(step.runningAnimationsAtCapture).toBe(0) // the fixture's 600 ms transition has settled
    }
  })

  it('captures before the transition settles only when the interval is shortened', async () => {
    const result = await inspectRun('fx-clean', ['--settle', '100', '--out', path.join(app, 'inspection/fx-fast')])
    expect(result.code, result.stdout + result.stderr).toBe(0)
    const report = JSON.parse(readFileSync(path.join(app, 'inspection/fx-fast/report.json'), 'utf8'))
    expect(report.steps.slice(1).every((s: { runningAnimationsAtCapture: number }) => s.runningAnimationsAtCapture > 0)).toBe(true)
    expect(report.steps.every((s: { elapsedMs: number }) => s.elapsedMs >= 100 && s.elapsedMs < 800)).toBe(true)
  })

  it('reports an unmarked text/chrome collision with the step and both elements, still exiting zero', async () => {
    const result = await inspectRun('fx-collision')
    expect(result.code, result.stdout + result.stderr).toBe(0)
    const warnings = warningsOf(result.stdout)
    const overlaps = warnings.filter((w) => w.includes('[overlap]'))
    const labels = overlaps.find((w) => w.includes('step 2'))!
    expect(labels).toContain('first overlapping label')
    expect(labels).toContain('second overlapping label')
    const chrome = overlaps.find((w) => w.includes('step 3'))!
    expect(chrome).toContain('COLLIDING TEXT')
    expect(chrome).toContain('data-presentation-title')
    expect(warnings.some((w) => w.includes('step 1'))).toBe(false)
    expect(warnings.every((w) => w.includes('[overlap]'))).toBe(true)
  })

  it('does not warn about an overlap inside an allow-overlap subtree', async () => {
    const result = await inspectRun('fx-allowed')
    expect(result.code, result.stdout + result.stderr).toBe(0)
    expect(warningsOf(result.stdout)).toEqual([])
  })

  it.each([
    ['fx-indistinct-progress', 'progress indicator', 'table-of-contents entry'],
    ['fx-indistinct-toc', 'table-of-contents entry', 'progress indicator'],
  ])('reports indistinct active chrome on %s (%s) but not the other kind', async (slug, flagged, other) => {
    const result = await inspectRun(slug)
    expect(result.code).toBe(0)
    const warnings = warningsOf(result.stdout)
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings.every((w) => w.includes('[active-chrome]'))).toBe(true)
    expect(warnings.some((w) => w.includes(`active ${flagged}`) && w.includes('step 1'))).toBe(true)
    expect(warnings.some((w) => w.includes(other))).toBe(false)
  })

  it.each([
    ['fx-attr-small', /9px \(under 11px\)/],
    ['fx-attr-default', /browser-default link styling/],
    ['fx-attr-missing', /attribution link is missing/],
  ])('reports unpolished attribution on %s and points at its hook', async (slug, reason) => {
    const result = await inspectRun(slug)
    expect(result.code).toBe(0)
    const warnings = warningsOf(result.stdout)
    expect(warnings).toHaveLength(3) // one per step
    warnings.forEach((w, i) => {
      expect(w).toContain('[attribution]')
      expect(w).toContain(`step ${i + 1}`)
      expect(w).toMatch(reason)
      expect(w).toContain('data-presentation-attribution')
    })
  })

  it.each([[[], 9], [['--viewport', '390x844'], 9]])('finds no advisory warnings on the committed sample (%j)', async (args, steps) => {
    const result = await inspectRun('how-to-make-a-presentation', args as string[])
    expect(result.code, result.stdout + result.stderr).toBe(0)
    expect(warningsOf(result.stdout)).toEqual([])
    expect(result.stdout).toContain(`${steps} screenshot(s)`)
  })

  it('fails (non-zero) only for operational problems such as an unknown route', async () => {
    const result = await run('node', ['scripts/inspect-presentation.mjs', 'does-not-exist', '--no-build'], { cwd: app, timeoutMs: 120000 })
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('FAIL [inspect]')
  })
})
