import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { copyRepo, sh } from '../helpers/repo-copy'

const copy = copyRepo('inspect-int-')
afterAll(() => copy.remove())

const SCENE = (extra: string) => `import { Box, Label, Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import './fixture.css'

function FixtureScene({ payload }: SceneProps<{ step: number }>) {
  return (
    <SceneLayer>
      <Label key="a" layoutId="a" at={{ x: 100, y: 100, w: 200, h: 30 }}>Collision A</Label>
      ${extra}
    </SceneLayer>
  )
}

const steps = [0, 1, 2].map((step) => ({
  id: 's' + step, era: step < 2 ? 'first' : 'second', title: 'Fixture ' + step, caption: 'Caption ' + step,
  Scene: FixtureScene, groupKey: 'fixture', payload: { step },
}))

export default function Talk() {
  return <Presentation steps={steps} title="Fixture" />
}
`

const DEFECT_EXTRA = `{payload.step === 1 && (
        <Label key="b" layoutId="b" at={{ x: 110, y: 104, w: 200, h: 30 }}>Collision B</Label>
      )}
      {payload.step === 2 && (
        <div data-presentation-allow-overlap="" style={{ position: 'absolute', left: 400, top: 100, width: 300, height: 40 }}>
          <Label key="c" layoutId="c" at={{ x: 0, y: 0, w: 200, h: 30 }}>Stacked one</Label>
          <Label key="d" layoutId="d" at={{ x: 10, y: 4, w: 200, h: 30 }}>Stacked two</Label>
        </div>
      )}
      <Box key="slow" layoutId="slow" at={{ x: 100, y: 250, w: 80, h: 40 }}
        animate={{ x: payload.step * 200 }} transition={{ duration: 1.2 }}>slow</Box>`

const POLISHED_CSS = `
[data-presentation-dot] { width: 10px; height: 10px; border-radius: 50%; border: 1px solid #888; background: transparent; }
[data-presentation-dot][data-presentation-active] { width: 24px; background: #c2410c; border-color: #c2410c; }
[data-presentation-toc-item] { border: 0; background: transparent; color: #555; }
[data-presentation-toc-item][data-presentation-active] { color: #000; font-weight: 700; background: #fde7d8; }
[data-presentation-attribution] { font-size: 12px; color: #444; text-decoration: none; }
`

type Report = { steps: { step: number; file: string; settled: boolean; animationsRunning: number; warnings: { kind: string; message: string }[] }[] }
const inspect = (slug: string, settle = 1600) => {
  const r = sh('node', ['scripts/inspect-presentation.mjs', slug, '--skip-build', '--settle', String(settle)], copy.dir)
  const dir = path.join(copy.dir, '.presentation-inspect', slug)
  const report: Report = JSON.parse(readFileSync(path.join(dir, 'report.json'), 'utf8'))
  return { ...r, dir, report }
}

beforeAll(() => {
  for (const [slug, css, extra] of [
    ['fixture-defects', '/* nothing: browser defaults */', DEFECT_EXTRA],
    ['fixture-polished', POLISHED_CSS, DEFECT_EXTRA.replace('{payload.step === 1 && (', '{false && (')],
  ]) {
    const dir = path.join(copy.dir, 'src/presentations', slug)
    sh('mkdir', ['-p', dir], copy.dir)
    copy.write(`src/presentations/${slug}/Talk.tsx`, SCENE(extra))
    copy.write(`src/presentations/${slug}/fixture.css`, css)
    copy.edit('src/presentations/index.ts', /\]\s*$/, `  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk') },\n]\n`)
  }
  const build = sh('npm', ['run', 'build'], copy.dir)
  expect(build.status, build.out).toBe(0)
})

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  it('writes one predictable screenshot per step', () => {
    const { dir, report, status } = inspect('fixture-defects')
    expect(status).toBe(0)
    expect(readdirSync(dir).filter((f) => f.endsWith('.png')).sort()).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    expect(report.steps.map((s) => s.file)).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    for (const s of report.steps) expect(existsSync(path.join(dir, s.file))).toBe(true)
  })

  it('captures only after transitions settle', () => {
    const { report } = inspect('fixture-defects')
    for (const s of report.steps) {
      expect(s.settled, `step ${s.step}`).toBe(true)
      expect(s.animationsRunning).toBe(0)
    }
    const early = inspect('fixture-defects', 0)
    expect(early.report.steps.some((s) => !s.settled), 'a too-short settle interval is detected').toBe(true)
  })

  it('warns on the unmarked collision for the right step only, and not on the allowed overlap', () => {
    const { report, out } = inspect('fixture-defects')
    const overlaps = (n: number) => report.steps[n - 1].warnings.filter((w) => w.kind === 'overlap')
    expect(overlaps(1)).toEqual([])
    expect(overlaps(2).map((w) => w.message).join('\n')).toMatch(/Collision A.*Collision B|Collision B.*Collision A/)
    expect(overlaps(3)).toEqual([])
    expect(out).toMatch(/WARN step 2 \[overlap\]/)
    expect(out).not.toMatch(/Stacked/)
  })

  it('warns about indistinct active chrome and unpolished attribution', () => {
    const { report, out } = inspect('fixture-defects')
    for (const s of report.steps) {
      const kinds = s.warnings.map((w) => w.kind)
      expect(kinds, `step ${s.step}`).toContain('active-chrome')
      expect(kinds, `step ${s.step}`).toContain('attribution')
    }
    expect(out).toContain('[data-presentation-attribution]')
    expect(out).toContain('[data-presentation-active]')
  })

  it('stays quiet for a polished presentation with an explicitly allowed overlap', () => {
    const { report, out, status } = inspect('fixture-polished')
    expect(status).toBe(0)
    expect(report.steps.flatMap((s) => s.warnings)).toEqual([])
    expect(out).toContain('0 advisory warning(s)')
  })
})
