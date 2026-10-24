import { createHash } from 'node:crypto'
import { cpSync, existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ROOT, copyApp, discard, edit, run } from './helpers.ts'

// INT-002: the screenshot helper writes faithful artifacts and advisory warnings.
const FIXTURES = path.join(ROOT, 'tests/fixtures/inspect')
const SETTLE = 600

describe('INT-002 screenshot helper emits faithful artifacts and advisory warnings', () => {
  let dir: string
  const results: Record<string, ReturnType<typeof run>> = {}
  const outDir = (slug: string) => path.join(dir, 'inspection', slug)
  const warnings = (slug: string) => results[slug].output.split('\n').filter((l) => l.startsWith('WARN step'))
  const forStep = (slug: string, index: number) => warnings(slug).filter((l) => l.startsWith(`WARN step ${index + 1} (index ${index})`))

  const inspect = (slug: string, extra: string[] = []) =>
    run('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle', String(SETTLE), ...extra], { cwd: dir })

  beforeAll(() => {
    dir = copyApp()
    const fx = path.join(dir, 'src/presentations/fx')
    cpSync(FIXTURES, fx, { recursive: true })
    // The fixtures import the kit from tests/fixtures/inspect/; in the copy it sits two levels up.
    edit(path.join(fx, 'common.tsx'), /'\.\.\/\.\.\/\.\.\/src\/presentation-kit\//g, "'../../presentation-kit/")
    const slugs = ['collision', 'allowed', 'chrome', 'attribution', 'missing', 'settle']
    const entries = slugs.map((s) => `  { slug: 'fx-${s}', title: 'Fixture ${s}', load: () => import('./fx/${s}.tsx') },\n`).join('')
    edit(path.join(dir, 'src/presentations/index.ts'), '\n]', `\n${entries}]`)
    const build = run('npm', ['run', 'build'], { cwd: dir })
    expect(build.code, build.output).toBe(0)
    for (const s of slugs) results[`fx-${s}`] = inspect(`fx-${s}`)
    results.narrow = inspect('fx-collision', ['--viewport', '390x844'])
  })
  afterAll(() => discard(dir))

  const pngSize = (file: string) => {
    const buf = readFileSync(file)
    expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
  }

  it('serves the built product through a production preview on 127.0.0.1', () => {
    for (const r of Object.values(results)) {
      expect(r.code, r.output).toBe(0)
      expect(r.output).toMatch(/\[inspect\] production preview http:\/\/127\.0\.0\.1:\d+\/fx-/)
      expect(r.output).toMatch(/vite preview host=127\.0\.0\.1/)
    }
    expect(existsSync(path.join(dir, 'dist/index.html'))).toBe(true)
  })

  it('writes one predictable, valid, desktop-sized, distinct screenshot per step', () => {
    const files = readdirSync(outDir('fx-collision')).sort()
    expect(files).toEqual(['captures.json', 'step-01.png', 'step-02.png', 'step-03.png'])
    const hashes = new Set<string>()
    for (const f of files.filter((n) => n.endsWith('.png'))) {
      expect(pngSize(path.join(outDir('fx-collision'), f))).toEqual([1280, 720])
      hashes.add(createHash('sha256').update(readFileSync(path.join(outDir('fx-collision'), f))).digest('hex'))
    }
    expect(hashes.size).toBe(3)
  })

  it('captures narrow viewports into their own directory', () => {
    const narrow = path.join(dir, 'inspection', 'fx-collision-390x844')
    expect(pngSize(path.join(narrow, 'step-01.png'))).toEqual([390, 844])
  })

  it('waits the settle interval before each capture, including after transitions', () => {
    const { captures } = JSON.parse(readFileSync(path.join(outDir('fx-settle'), 'captures.json'), 'utf8'))
    expect(captures).toHaveLength(3)
    for (const c of captures) {
      expect(c.settleMs).toBe(SETTLE)
      expect(c.waitedMs).toBeGreaterThanOrEqual(SETTLE - 5)
    }
    const order = [...results['fx-settle'].output.matchAll(/step (\d)\/3 ->/g)].map((m) => Number(m[1]))
    expect(order).toEqual([1, 2, 3])
  })

  it('warns about an unmarked text collision at the offending step, naming both elements', () => {
    expect(forStep('fx-collision', 0).filter((w) => w.includes('overlap'))).toEqual([])
    const hit = forStep('fx-collision', 1).filter((w) => w.includes('overlap:'))
    expect(hit.length).toBeGreaterThanOrEqual(1)
    expect(hit.some((w) => w.includes('alpha') && w.includes('beta'))).toBe(true)
    expect(forStep('fx-collision', 2).filter((w) => w.includes('overlap'))).toEqual([])
  })

  it('exempts an explicitly allowed overlap but still reports an unrelated collision', () => {
    expect(forStep('fx-allowed', 1).filter((w) => w.includes('overlap'))).toEqual([])
    const late = forStep('fx-allowed', 2).filter((w) => w.includes('overlap:'))
    expect(late.some((w) => w.includes('gamma') && w.includes('delta'))).toBe(true)
    expect(late.some((w) => w.includes('under') || w.includes('over '))).toBe(false)
  })

  it('warns when active progress and table-of-contents chrome is indistinct, with polished chrome quiet', () => {
    for (const i of [0, 1, 2]) {
      const w = forStep('fx-chrome', i).join('\n')
      expect(w).toContain('progress indicator is visually indistinct')
      expect(w).toContain('table-of-contents entry is visually indistinct')
    }
    expect(warnings('fx-collision').some((w) => w.includes('indistinct'))).toBe(false)
  })

  it('warns about unpolished attribution at every step, pointing to the styling hook', () => {
    for (const i of [0, 1, 2]) {
      const w = forStep('fx-attribution', i).filter((l) => l.includes('attribution'))
      expect(w.length).toBeGreaterThan(0)
      expect(w.join('\n')).toContain('[data-presentation-attribution]')
      expect(w.join('\n')).toContain('browser-default')
    }
    expect(warnings('fx-collision').some((w) => w.includes('attribution'))).toBe(false)
  })

  it('diagnoses a missing attribution link instead of skipping it', () => {
    expect(forStep('fx-missing', 0).some((w) => w.includes('attribution link [data-presentation-attribution] is missing'))).toBe(true)
  })

  it('treats screenshots and warnings as advisory: a warning-heavy run still exits zero and says so', () => {
    expect(results['fx-chrome'].code).toBe(0)
    expect(results['fx-chrome'].output).toContain('Advisory only: `npm run verify` is the gate.')
  })

  it('fails with a clear message for an unknown presentation', () => {
    const r = inspect('does-not-exist')
    expect(r.code).not.toBe(0)
    expect(r.output).toContain('INSPECT FAILED')
  })
})

