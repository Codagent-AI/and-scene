import { cp, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REPO, copyApp, edit, remove, run, tempDir } from '../helpers/workspace'

interface Warning {
  kind: string
  message: string
  steps: number[]
}
interface Report {
  settleMs: number
  steps: { step: number; file: string; navigatedAt: number; capturedAt: number }[]
  warnings: Warning[]
}

const SETTLE = 700

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  let dir: string
  let out: string
  let plain: Report
  let polished: Report
  let collide: Report
  let small: Report
  let narrow: Report
  let plainRun: Awaited<ReturnType<typeof run>>

  const inspect = async (slug: string, extra: string[] = []) => {
    const result = await run('node', ['scripts/inspect-presentation.mjs', slug, '--out', out, '--settle', String(SETTLE), ...extra], dir)
    expect(result.code, result.output).toBe(0)
    return result
  }
  const report = async (slug: string) => JSON.parse(await readFile(path.join(out, slug, 'report.json'), 'utf8')) as Report

  beforeAll(async () => {
    dir = await copyApp('inspect')
    out = await tempDir('inspect-out')
    const fixtureDir = path.join(dir, 'src/presentations/inspect-fixture')
    await cp(path.join(REPO, 'tests/fixtures/inspect'), fixtureDir, { recursive: true })
    // inside the copy the kit is one directory level closer than in tests/fixtures
    for (const file of (await readdir(fixtureDir)).filter((f) => /\.tsx?$/.test(f))) {
      await edit(path.join(fixtureDir, file), (t) => t.replaceAll("'../../../src/presentation-kit'", "'../../presentation-kit'"))
    }
    await edit(path.join(dir, 'src/presentations/index.ts'), (t) =>
      t.replace(
        '= [',
        "= [\n  { slug: 'plain', title: 'Plain', load: () => import('./inspect-fixture/Plain') },\n  { slug: 'polished', title: 'Polished', load: () => import('./inspect-fixture/Polished') },\n  { slug: 'collide', title: 'Collide', load: () => import('./inspect-fixture/Collide') },\n  { slug: 'small', title: 'Small', load: () => import('./inspect-fixture/Small') },",
      ),
    )
    plainRun = await inspect('plain')
    polished = await (async () => {
      await inspect('polished', ['--skip-build'])
      return report('polished')
    })()
    plain = await report('plain')
    await inspect('collide', ['--skip-build'])
    collide = await report('collide')
    await inspect('small', ['--skip-build'])
    small = await report('small')
    await inspect('polished', ['--skip-build', '--viewport', '390x844'])
    narrow = await report('polished')
  })
  afterAll(async () => {
    await remove(dir)
    await remove(out)
  })

  it('writes one predictable screenshot per step', async () => {
    const files = (await readdir(path.join(out, 'plain'))).filter((f) => f.endsWith('.png')).sort()
    expect(files).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    expect(plain.steps.map((s) => s.step)).toEqual([1, 2, 3])
    expect(plainRun.output).toContain('3 screenshots')
  })

  it('captures only after the settle interval following each navigation', () => {
    expect(plain.settleMs).toBe(SETTLE)
    for (const s of plain.steps) expect(s.capturedAt - s.navigatedAt).toBeGreaterThanOrEqual(SETTLE)
  })

  it('warns about an unmarked text collision and names the step and elements', () => {
    const overlaps = plain.warnings.filter((w) => w.kind === 'overlap')
    expect(overlaps).toHaveLength(1)
    expect(overlaps[0].steps).toEqual([2])
    expect(overlaps[0].message).toMatch(/collision alpha/)
    expect(overlaps[0].message).toMatch(/collision beta/)
    expect(plainRun.output).toMatch(/WARN overlap \(step 2\)/)
  })

  it('does not warn about an explicitly allowed overlap', () => {
    expect(plain.warnings.some((w) => /stacked/.test(w.message))).toBe(false)
    expect(plain.warnings.some((w) => w.kind === 'overlap' && w.steps.includes(3))).toBe(false)
  })

  it('warns about indistinct active progress indicators and table-of-contents entries', () => {
    const active = plain.warnings.filter((w) => w.kind === 'active-chrome')
    expect(active.find((w) => /progress indicator/.test(w.message))?.steps).toEqual([1, 2, 3])
    expect(active.find((w) => /table-of-contents entry/.test(w.message))?.steps).toEqual([1, 2, 3])
  })

  it('warns when visible text collides with presentation chrome and names both', () => {
    const overlaps = collide.warnings.filter((w) => w.kind === 'overlap')
    expect(overlaps.length).toBeGreaterThan(0)
    expect(overlaps.every((w) => w.steps.includes(1))).toBe(true)
    expect(overlaps.some((w) => /host text over chrome/.test(w.message) && /data-presentation-(header|marker)/.test(w.message))).toBe(true)
  })

  it('warns about unpolished attribution and points to the styling hook', () => {
    const attribution = plain.warnings.find((w) => w.kind === 'attribution')
    expect(attribution?.message).toMatch(/browser-default/)
    expect(attribution?.message).toContain('[data-presentation-attribution]')
  })

  it('warns about undersized attribution even when it is styled', () => {
    const attribution = small.warnings.filter((w) => w.kind === 'attribution')
    expect(attribution).toHaveLength(1)
    expect(attribution[0].message).toMatch(/too small \(8px\)/)
    expect(attribution[0].message).toContain('[data-presentation-attribution]')
  })

  it('warns when canvas scaling makes scene text too small, only on a narrow viewport', () => {
    const tiny = narrow.warnings.filter((w) => w.kind === 'small-text')
    expect(tiny.length).toBeGreaterThan(0)
    expect(tiny[0].message).toMatch(/scene text renders as small as/)
    expect(polished.warnings.filter((w) => w.kind === 'small-text')).toEqual([])
  })

  it('stays quiet about polished active chrome and attribution while inactive controls exist', () => {
    expect(polished.steps).toHaveLength(3)
    expect(polished.warnings.filter((w) => w.kind === 'active-chrome')).toEqual([])
    expect(polished.warnings.filter((w) => w.kind === 'attribution')).toEqual([])
  })
})
