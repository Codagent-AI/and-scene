import { mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { FIXTURE_CSS, FIXTURE_TSX, VARIANTS, slugOf, talkTsx, type Variant } from '../helpers/inspect-fixture'
import { copyProject, hasLeakedProcess, run, type RunResult } from '../helpers/project-copy'

// INT-002: the project-local inspection helper against a production preview in Chromium.
let project: string
const results = new Map<Variant, RunResult>()

const inspect = (slug?: string, ...args: string[]) =>
  run(process.execPath, [join(project, 'scripts', 'inspect-presentation.mjs'), ...(slug ? [slug] : []), ...args], tmpdir(), 240_000)

const shots = (slug: string, sub = '') =>
  readdirSync(join(project, '.inspection', slug, sub)).filter((f) => f.endsWith('.png')).sort()

function pngSize(file: string) {
  const bytes = readFileSync(file)
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
}

beforeAll(() => {
  project = mkdtempSync(join(tmpdir(), 'and-scene-int2-'))
  copyProject(project)
  const dir = join(project, 'src', 'presentations', 'fx')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'Fixture.tsx'), FIXTURE_TSX)
  writeFileSync(join(dir, 'fixture.css'), FIXTURE_CSS)
  for (const v of VARIANTS) {
    mkdirSync(join(dir, v), { recursive: true })
    writeFileSync(join(dir, v, 'Talk.tsx'), talkTsx(v))
  }
  const index = join(project, 'src', 'presentations', 'index.ts')
  const entries = VARIANTS.map((v) => `  { slug: '${slugOf(v)}', title: 'Fixture ${v}', load: () => import('./fx/${v}/Talk') },`).join('\n')
  writeFileSync(index, readFileSync(index, 'utf8').replace('] = [\n', `] = [\n${entries}\n`))
  const build = run('npm', ['run', 'build'], project)
  if (build.status !== 0) throw new Error(build.stdout + build.stderr)
  for (const v of VARIANTS) results.set(v, inspect(slugOf(v), '--settle-ms', '800'))
})

afterAll(() => {
  if (project) rmSync(project, { recursive: true, force: true })
})

const out = (v: Variant) => results.get(v)!
const warns = (v: Variant) => out(v).stdout.split('\n').filter((l) => l.startsWith('WARN'))

describe('INT-002 screenshots', () => {
  it.each(VARIANTS)('%s: writes one decodable full-size PNG per step and exits 0', (v) => {
    expect(out(v).status, out(v).stderr).toBe(0)
    expect(shots(slugOf(v))).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    for (const f of shots(slugOf(v))) {
      const file = join(project, '.inspection', slugOf(v), f)
      expect(statSync(file).size).toBeGreaterThan(1000)
      expect(pngSize(file)).toEqual([1440, 900])
    }
    expect(out(v).stdout).toContain(`screenshots in .inspection/${slugOf(v)}`)
  })

  it('captures only after the settle interval has elapsed between steps', () => {
    const slow = inspect(slugOf('clean'), '--settle-ms', '700')
    expect(slow.status).toBe(0)
    const times = shots(slugOf('clean')).map((f) => statSync(join(project, '.inspection', slugOf('clean'), f)).mtimeMs)
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(650)
    expect(times[2] - times[1]).toBeGreaterThanOrEqual(650)
  })

  it('supports a narrow viewport into its own directory', () => {
    const narrow = inspect(slugOf('clean'), '--viewport', '390x844', '--settle-ms', '100')
    expect(narrow.status, narrow.stderr).toBe(0)
    const files = shots(slugOf('clean'), '390x844')
    expect(files).toHaveLength(3)
    expect(pngSize(join(project, '.inspection', slugOf('clean'), '390x844', files[0]))).toEqual([390, 844])
  })
})

describe('INT-002 advisory warnings', () => {
  it('stays silent for the clean control', () => {
    expect(warns('clean')).toEqual([])
    expect(out('clean').stdout).toContain('0 warning(s)')
  })

  it('reports the unmarked text collision on its own step only, naming both elements', () => {
    const overlaps = warns('collision').filter((w) => w.includes('overlaps'))
    expect(overlaps, overlaps.join('\n')).toHaveLength(1)
    expect(overlaps[0]).toMatch(/^WARN step 2:/)
    expect(overlaps[0]).toContain('Alpha label')
    expect(overlaps[0]).toContain('Colliding label')
    expect(warns('collision').filter((w) => !w.includes('overlaps'))).toEqual([])
  })

  it('does not warn about the explicitly allowed overlap', () => {
    expect(warns('allowed')).toEqual([])
  })

  it('reports indistinct active progress and ToC chrome for every step', () => {
    for (const step of [1, 2, 3]) {
      expect(warns('indistinct')).toEqual(expect.arrayContaining([
        expect.stringMatching(new RegExp(`^WARN step ${step}: active progress indicator is visually indistinct`)),
        expect.stringMatching(new RegExp(`^WARN step ${step}: active table-of-contents entry is visually indistinct`)),
      ]))
    }
    expect(warns('indistinct').filter((w) => /attribution|overlaps/.test(w))).toEqual([])
  })

  it('reports unpolished attribution for every step and points at its styling hook', () => {
    for (const step of [1, 2, 3]) {
      expect(warns('attribution')).toEqual(expect.arrayContaining([
        expect.stringMatching(new RegExp(`^WARN step ${step}: attribution .*browser-default.*data-presentation-attribution`)),
      ]))
    }
    expect(warns('attribution').filter((w) => /indistinct|overlaps/.test(w))).toEqual([])
  })

  it('treats warnings as advisory: exit 0 and every screenshot still written', () => {
    for (const v of ['collision', 'indistinct', 'attribution'] as const) {
      expect(out(v).status).toBe(0)
      expect(shots(slugOf(v))).toHaveLength(3)
    }
  })
})

describe('INT-002 operational failures', () => {
  it('fails (non-zero) without a production build, rather than falling back to a dev server', () => {
    const dist = join(project, 'dist')
    renameSync(dist, dist + '.bak')
    try {
      const r = inspect(slugOf('clean'))
      expect(r.status).not.toBe(0)
      expect(r.stderr).toMatch(/no production build/)
    } finally {
      renameSync(dist + '.bak', dist)
    }
  })

  it('fails for an unregistered slug or bad arguments', () => {
    expect(inspect('not-a-slug').status).not.toBe(0)
    expect(inspect('not-a-slug').stderr).toMatch(/not registered/)
    expect(inspect(slugOf('clean'), '--viewport', 'huge').status).not.toBe(0)
    expect(inspect().status).not.toBe(0)
  })

  it('leaves no preview server behind', () => {
    expect(hasLeakedProcess(project)).toBe(false)
  })
})
