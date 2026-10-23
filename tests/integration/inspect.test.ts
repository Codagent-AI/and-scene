import { readFileSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, REPO, remove, run, write } from '../helpers/project.ts'

// INT-002: the project-local screenshot helper against controlled registered
// presentations in a disposable copy, driven through a production preview.
const VARIANTS = ['clean', 'collision', 'allowed', 'chrome', 'attribution-small', 'attribution-default', 'settle'] as const
let dir: string

interface Inspection {
  code: number | null
  output: string
  warnings: string[]
}

async function inspect(variant: string, extra: string[] = []): Promise<Inspection> {
  const r = await run('node', ['scripts/inspect-presentation.mjs', `fx-${variant}`, '--no-build', '--settle=300', ...extra], { cwd: dir })
  const output = `${r.stdout}\n${r.stderr}`
  return { code: r.code, output, warnings: output.split('\n').filter((l) => l.startsWith('WARN ')) }
}

const png = (variant: string, n: number, suffix = '') => path.join(dir, 'inspection', `fx-${variant}${suffix}`, `step-0${n}.png`)
const dimensions = (file: string) => {
  const b = readFileSync(file)
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
}

beforeAll(async () => {
  dir = copyProject()
  write(dir, 'src/presentations/fixtures/index.tsx', readFileSync(path.join(REPO, 'tests/integration/fixtures/inspect-fixtures.tsx'), 'utf8').replace(/\.\.\/\.\.\/\.\.\/src\/presentation-kit/g, '../../presentation-kit'))
  for (const v of VARIANTS) {
    write(dir, `src/presentations/fx-${v}/Talk.tsx`, `import { makeTalk } from '../fixtures/index.tsx'\nexport default makeTalk('${v}')\n`)
  }
  const entries = VARIANTS.map((v) => `  { slug: 'fx-${v}', title: 'Fixture ${v}', load: () => import('./fx-${v}/Talk.tsx') },`).join('\n')
  write(dir, 'src/presentations/index.ts', readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8').replace(/\n\]/, `\n${entries}\n]`))
  const build = await run('npm', ['run', 'build'], { cwd: dir })
  if (build.code !== 0) throw new Error(`fixture build failed\n${build.stdout}\n${build.stderr}`)
}, 300_000)

afterAll(() => remove(dir))

describe('artifacts', () => {
  it('writes one predictable, correctly sized, non-empty screenshot per step at 1280 x 720 and exits zero', async () => {
    const r = await inspect('clean')
    expect(r.code).toBe(0)
    expect(r.output).toContain('captured 3 screenshots in inspection/fx-clean')
    for (const n of [1, 2, 3]) {
      expect(statSync(png('clean', n)).size).toBeGreaterThan(1000)
      expect(dimensions(png('clean', n))).toEqual({ width: 1280, height: 720 })
    }
    expect(() => statSync(png('clean', 4))).toThrow()
  })

  it('uses the narrow viewport and a separate directory with --narrow', async () => {
    const r = await inspect('clean', ['--narrow'])
    expect(r.code).toBe(0)
    expect(dimensions(png('clean', 1, '-narrow'))).toEqual({ width: 390, height: 844 })
  })

  it('stays quiet for a clean presentation, so warnings are not unconditional', async () => {
    const r = await inspect('clean')
    expect(r.warnings).toEqual([])
    expect(r.output).toContain('0 advisory warning(s)')
  })
})

describe('overlap diagnostics', () => {
  it('names the step and both elements of an unmarked text collision, and only that step', async () => {
    const r = await inspect('collision')
    expect(r.code).toBe(0) // advisory only
    expect(r.warnings).toHaveLength(1)
    expect(r.warnings[0]).toMatch(/^WARN step 02 overlap:/)
    expect(r.warnings[0]).toContain('Alpha text')
    expect(r.warnings[0]).toContain('Beta text')
  })

  it('exempts an allowed subtree without suppressing unrelated collisions', async () => {
    const r = await inspect('allowed')
    expect(r.code).toBe(0)
    expect(r.warnings.filter((w) => w.startsWith('WARN step 02 overlap'))).toEqual([])
    const other = r.warnings.filter((w) => w.startsWith('WARN step 03 overlap'))
    expect(other).toHaveLength(1)
    expect(other[0]).toContain('Gamma text')
    expect(other[0]).toContain('Delta text')
    expect(r.warnings).toHaveLength(1)
  })
})

describe('chrome diagnostics', () => {
  it('reports indistinct active progress and table-of-contents chrome on every step', async () => {
    const r = await inspect('chrome')
    expect(r.code).toBe(0)
    for (const n of ['01', '02', '03']) {
      expect(r.warnings.some((w) => w.startsWith(`WARN step ${n} active-chrome`) && w.includes('progress indicator'))).toBe(true)
      expect(r.warnings.some((w) => w.startsWith(`WARN step ${n} active-chrome`) && w.includes('table-of-contents entry'))).toBe(true)
    }
    expect(r.warnings.every((w) => w.includes('active-chrome'))).toBe(true)
  })

  it('reports an undersized attribution and points at the styling hook', async () => {
    const r = await inspect('attribution-small')
    expect(r.code).toBe(0)
    expect(r.warnings).toHaveLength(3)
    for (const [i, w] of r.warnings.entries()) {
      expect(w).toMatch(new RegExp(`^WARN step 0${i + 1} attribution:`))
      expect(w).toContain('data-presentation-attribution')
      expect(w).toMatch(/9px/)
    }
  })

  it('reports the browser-default attribution look', async () => {
    const r = await inspect('attribution-default')
    expect(r.code).toBe(0)
    expect(r.warnings.length).toBeGreaterThanOrEqual(3)
    expect(r.warnings.every((w) => w.includes('attribution') && w.includes('data-presentation-attribution'))).toBe(true)
    expect(r.warnings.some((w) => w.includes('browser-default'))).toBe(true)
  })
})

describe('settling', () => {
  it('captures a transition only after the settle interval, not mid-motion', async () => {
    const shot = async (settle: number) => {
      rmSync(path.join(dir, 'inspection/fx-settle'), { recursive: true, force: true })
      const r = await run('node', ['scripts/inspect-presentation.mjs', 'fx-settle', '--no-build', `--settle=${settle}`], { cwd: dir })
      expect(r.code).toBe(0)
      return readFileSync(png('settle', 2))
    }
    const early = await shot(0)
    const settled = await shot(1200)
    const reference = await shot(2500)
    expect(settled.equals(reference)).toBe(true)
    expect(early.equals(reference)).toBe(false)
  })
})

describe('operational failures', () => {
  it('exits non-zero for an unknown slug, unlike advisory warnings', async () => {
    const r = await run('node', ['scripts/inspect-presentation.mjs', 'does-not-exist', '--no-build', '--settle=0'], { cwd: dir })
    expect(r.code).not.toBe(0)
  })
})
