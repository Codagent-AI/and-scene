import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { copyRepo, node } from './helpers'

const FIXTURE = `import { Label, Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'

const at = (x: number, y: number) => ({ position: 'absolute', left: x, top: y }) as const

function Scene({ payload }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      {payload.n === 1 && (
        <>
          <Label id="f/a" style={at(100, 100)}>Alpha collision</Label>
          <Label id="f/b" style={at(110, 104)}>Beta collision</Label>
        </>
      )}
      {payload.n === 2 && (
        <div data-presentation-allow-overlap="">
          <Label id="f/c" style={at(100, 100)}>Gamma stacked</Label>
          <Label id="f/d" style={at(110, 104)}>Delta stacked</Label>
        </div>
      )}
      {payload.n === 3 && <Label id="f/e" style={at(100, 100)}>Epsilon alone</Label>}
    </SceneLayer>
  )
}
const eras = ['one', 'one', 'two']
const STEPS: Step<{ n: number }>[] = eras.map((era, i) => ({
  id: 's' + i, era, title: 'T' + i, caption: 'C' + i, Scene, groupKey: 'g', payload: { n: i + 1 },
}))
export default function Talk() {
  return <Presentation steps={STEPS} title="Fixture" initialMode="browse" />
}
`

// INT-002: screenshots and advisory warnings from a controlled fixture presentation.
describe('INT-002 inspection helper', () => {
  it('writes one settled screenshot per step and reports step-specific advisory warnings', () => {
    const dir = copyRepo()
    fs.mkdirSync(path.join(dir, 'src/presentations/fixture'))
    fs.writeFileSync(path.join(dir, 'src/presentations/fixture/Talk.tsx'), FIXTURE)
    const idx = path.join(dir, 'src/presentations/index.ts')
    fs.writeFileSync(
      idx,
      fs.readFileSync(idx, 'utf8').replace(
        'export const presentations: PresentationEntry[] = [',
        "export const presentations: PresentationEntry[] = [\n  { slug: 'fixture', title: 'Fixture', load: () => import('./fixture/Talk') },",
      ),
    )
    const started = Date.now()
    const r = node(dir, ['scripts/inspect-presentation.mjs', '--settle', '700', 'fixture'])
    const elapsed = Date.now() - started
    expect(r.code, r.out).toBe(0)

    const out = path.join(dir, '.inspection/fixture')
    for (const n of ['01', '02', '03']) expect(fs.existsSync(path.join(out, `step-${n}.png`))).toBe(true)
    expect(fs.readdirSync(out).filter((f) => f.endsWith('.png'))).toHaveLength(3)

    const report = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'))
    expect(report.steps.map((s: { settleMs: number }) => s.settleMs)).toEqual([700, 700, 700])
    expect(elapsed).toBeGreaterThanOrEqual(3 * 700)

    const warns = (step: number): string[] => report.steps[step - 1].warnings
    expect(warns(1).some((w) => w.startsWith('overlap') && w.includes('Alpha') && w.includes('Beta'))).toBe(true)
    expect(r.out).toMatch(/WARN step 1: overlap/)
    expect(warns(2).filter((w) => w.startsWith('overlap'))).toEqual([])
    expect(warns(3).filter((w) => w.startsWith('overlap'))).toEqual([])
    for (const step of [1, 2, 3]) {
      expect(warns(step).some((w) => w.includes('active progress indicator')), `step ${step} dot`).toBe(true)
      expect(warns(step).some((w) => w.startsWith('attribution') && w.includes('[data-presentation-attribution]')), `step ${step} attribution`).toBe(true)
    }
    expect(warns(1).some((w) => w.includes('table-of-contents entry'))).toBe(true)
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
