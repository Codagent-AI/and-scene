// INT-002: the screenshot helper emits one settled screenshot per step and step-keyed advisory
// warnings. Runs against a throwaway copy of the repo with a controlled fixture registered.
import { spawn } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, readdirSync, statSync, symlinkSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SOURCE = resolve(import.meta.dirname, '..')
let dir = ''

interface Run { code: number | null; out: string }

function runInspect(args: string[]): Promise<Run> {
  return new Promise((res) => {
    const child = spawn(process.execPath, [join(dir, 'scripts/inspect-presentation.mjs'), ...args], { cwd: dir })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('close', (code) => res({ code, out }))
  })
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'and-scene-inspect-'))
  cpSync(SOURCE, dir, {
    recursive: true,
    filter: (src) => !/(^|\/)(node_modules|dist|\.git|openspec|validator_logs|\.inspection)(\/|$)/.test(src.slice(SOURCE.length)),
  })
  symlinkSync(join(SOURCE, 'node_modules'), join(dir, 'node_modules'), 'dir')
  mkdirSync(join(dir, 'src/presentations/inspection-fixture'))
  cpSync(join(SOURCE, 'tests/fixtures/inspection-fixture/Talk.tsx'), join(dir, 'src/presentations/inspection-fixture/Talk.tsx'))
  const idx = join(dir, 'src/presentations/index.ts')
  writeFileSync(
    idx,
    readFileSync(idx, 'utf8').replace(
      'export const presentations: PresentationEntry[] = [',
      "export const presentations: PresentationEntry[] = [\n  { slug: 'inspection-fixture', title: 'Fixture', load: () => import('./inspection-fixture/Talk') },",
    ),
  )
})

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
})

describe('inspect-presentation helper (INT-002)', () => {
  it('captures settled per-step screenshots and step-specific warnings', async () => {
    const settle = 800
    const run = await runInspect(['inspection-fixture', '--settle', String(settle)])
    expect(run.code, run.out).toBe(0)

    const shots = readdirSync(join(dir, '.inspection/inspection-fixture')).sort()
    expect(shots).toEqual(['step-01.png', 'step-02.png', 'step-03.png', 'step-04.png'])
    for (const s of shots) expect(statSync(join(dir, '.inspection/inspection-fixture', s)).size).toBeGreaterThan(2000)

    // Captures happen only after the configured settle interval following each step change.
    const waits = [...run.out.matchAll(/captured step \d+ after (\d+)ms settle/g)].map((m) => Number(m[1]))
    expect(waits).toHaveLength(4)
    for (const w of waits) expect(w).toBeGreaterThanOrEqual(settle)

    // Unmarked collision: reported on step 2 only; the allowed overlap (step 3) is not.
    const overlaps = run.out.split('\n').filter((l) => l.includes('[overlap]'))
    expect(overlaps).toHaveLength(1)
    expect(overlaps[0]).toMatch(/^warn step 02 /)
    expect(overlaps[0]).toContain('First colliding label')
    expect(overlaps[0]).toContain('Second colliding label')
    expect(run.out).not.toMatch(/warn step 03 \[overlap\]/)

    // Indistinct active chrome and unpolished attribution are keyed to every step.
    for (const n of ['01', '02', '03', '04']) {
      expect(run.out).toMatch(new RegExp(`warn step ${n} \\[active-chrome\\]`))
      expect(run.out).toMatch(new RegExp(`warn step ${n} \\[attribution\\].*\\[data-presentation-attribution\\]`))
    }
  })

  it('supports a narrow viewport and a custom output directory', async () => {
    const out = join(dir, 'narrow-out')
    const run = await runInspect(['inspection-fixture', '--no-build', '--settle', '100', '--viewport', '390x844', '--out', out])
    expect(run.code, run.out).toBe(0)
    expect(readdirSync(out)).toHaveLength(4)
  })

  it('exits non-zero for an unknown slug', async () => {
    const run = await runInspect(['nope', '--no-build'])
    expect(run.code).toBe(1)
    expect(run.out).toMatch(/unknown slug "nope"/)
  })
})
