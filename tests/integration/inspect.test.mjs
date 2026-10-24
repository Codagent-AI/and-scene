// INT-002: the project-local screenshot helper against a controlled fixture presentation.
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, inject, it } from 'vitest'
import { registerPresentation } from '../../skills/presentation/scripts/register.mjs'
import { scaffoldMissing } from '../../skills/presentation/scripts/scaffold.mjs'
import { edit, linkNodeModules, run, tmpDir } from '../helpers/project.mjs'

const SETTLE = 700

const SCENE = `import { Label, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'

export function FixtureScene({ payload }: SceneProps<{ kind: 'clean' | 'collision' | 'allowed' }>) {
  return (
    <SceneLayer>
      {payload.kind === 'clean' && (
        <Label id="clean" x={40} y={40}>clean text</Label>
      )}
      {payload.kind === 'collision' && (
        <>
          <Label id="collide-a" x={100} y={100}>collide A</Label>
          <Label id="collide-b" x={100} y={104}>collide B</Label>
        </>
      )}
      {payload.kind === 'allowed' && (
        <div data-presentation-allow-overlap style={{ position: 'absolute', inset: 0 }}>
          <Label id="allowed-a" x={100} y={100}>allowed A</Label>
          <Label id="allowed-b" x={100} y={104}>allowed B</Label>
        </div>
      )}
    </SceneLayer>
  )
}
`

const talk = (slug, css) => `import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'
import { FixtureScene } from './scene'
${css ? "import './style.css'\n" : ''}
type Kind = 'clean' | 'collision' | 'allowed'
const make = (kind: Kind, era: string): Step<{ kind: Kind }> => ({
  id: kind, era, title: kind, caption: 'caption ' + kind, groupKey: 'g', payload: { kind }, Scene: FixtureScene,
})
const STEPS = [make('clean', 'one'), make('collision', 'two'), make('allowed', 'three')]

export default function Talk() {
  return <Presentation steps={STEPS} title="${slug}" initialMode="browse" />
}
`

const STYLED_CSS = `
[data-presentation-progress-item] { width: 10px; height: 10px; padding: 0; border: 1px solid #888; border-radius: 50%; background: transparent; }
[data-presentation-progress-item][data-presentation-active="true"] { width: 28px; background: #c7a755; border-color: #c7a755; }
[data-presentation-toc-item] { background: transparent; border: 0; color: #888; }
[data-presentation-toc-item][data-presentation-active="true"] { color: #fff; font-weight: 700; background: #333; }
[data-presentation-attribution] { font-size: 13px; color: #aaa; text-decoration: none; padding: 6px 12px; }
`

let dir
const report = (slug) => JSON.parse(fs.readFileSync(path.join(dir, '.inspection', slug, 'report.json'), 'utf8'))
const warnings = (slug, kind) => report(slug).warnings.filter((w) => w.kind === kind)

describe('inspect-presentation helper', () => {
  let rawRun
  let styledRun

  beforeAll(async () => {
    dir = tmpDir('and-scene-inspect-')
    scaffoldMissing(dir)
    linkNodeModules(path.join(inject('materialized'), 'node_modules'), dir)
    for (const [slug, css] of [['raw', false], ['styled', true]]) {
      const folder = path.join(dir, 'src/presentations', slug)
      fs.mkdirSync(folder, { recursive: true })
      fs.writeFileSync(path.join(folder, 'scene.tsx'), SCENE)
      fs.writeFileSync(path.join(folder, 'Talk.tsx'), talk(slug, css))
      if (css) fs.writeFileSync(path.join(folder, 'style.css'), STYLED_CSS)
      registerPresentation(dir, { slug, title: slug })
    }
    const build = await run('npm', ['run', 'build'], { cwd: dir })
    expect(build.code, build.output).toBe(0)
    rawRun = await run('npm', ['run', 'inspect', '--', 'raw', '--no-build', '--settle', String(SETTLE)], { cwd: dir })
    styledRun = await run('npm', ['run', 'inspect', '--', 'styled', '--no-build', '--settle', String(SETTLE)], { cwd: dir })
  })

  it('writes one screenshot per step under a predictable project-local directory', () => {
    expect(rawRun.code, rawRun.output).toBe(0)
    for (const n of ['01', '02', '03']) {
      const file = path.join(dir, '.inspection/raw', `step-${n}.png`)
      expect(fs.readFileSync(file).subarray(1, 4).toString()).toBe('PNG')
    }
    expect(fs.readdirSync(path.join(dir, '.inspection/raw')).filter((f) => f.endsWith('.png'))).toHaveLength(3)
    expect(rawRun.stdout).toContain('3 screenshots in .inspection/raw')
  })

  it('captures only after the settle interval has elapsed', () => {
    const { steps } = report('raw')
    expect(steps.map((s) => s.id)).toEqual(['clean', 'collision', 'allowed'])
    for (const s of steps) expect(s.settledMs).toBeGreaterThanOrEqual(SETTLE)
  })

  it('reports the unmarked collision for its step only, naming both elements', () => {
    const [overlap, ...rest] = warnings('raw', 'overlap')
    expect(rest).toEqual([])
    expect(overlap.steps).toEqual([2])
    expect(overlap.message).toContain('collide A')
    expect(overlap.message).toContain('collide B')
    expect(rawRun.stdout).toMatch(/WARN \[overlap\] step 2: .*collide/)
  })

  it('does not report overlap inside an allow-overlap subtree', () => {
    for (const slug of ['raw', 'styled']) {
      expect(JSON.stringify(report(slug).warnings)).not.toContain('allowed A')
      for (const w of warnings(slug, 'overlap')) expect(w.steps).not.toContain(3)
    }
  })

  it('reports indistinct active progress and ToC chrome on every step', () => {
    const labels = warnings('raw', 'indistinct-active').map((w) => [w.message, w.steps])
    expect(labels).toHaveLength(2)
    for (const [message, steps] of labels) {
      expect(message).toMatch(/progress indicator|table-of-contents entry/)
      expect(steps).toEqual([1, 2, 3])
    }
  })

  it('reports browser-default attribution and points at the styling hook', () => {
    const [attribution] = warnings('raw', 'attribution')
    expect(attribution.message).toContain('browser-default')
    expect(attribution.message).toContain('[data-presentation-attribution]')
  })

  it('reports no chrome or attribution warnings once the presentation styles them', () => {
    expect(styledRun.code, styledRun.output).toBe(0)
    expect(warnings('styled', 'indistinct-active')).toEqual([])
    expect(warnings('styled', 'attribution')).toEqual([])
    expect(warnings('styled', 'overlap').map((w) => w.steps)).toEqual([[2]])
  })

  it('warns about canvas text that scales below a readable size on a narrow viewport only', async () => {
    expect(warnings('styled', 'small-text')).toEqual([])
    const narrow = await run('npm', ['run', 'inspect', '--', 'styled', '--no-build', '--settle', '300', '--viewport', '300x700'], { cwd: dir })
    expect(narrow.code, narrow.output).toBe(0)
    const [small] = warnings('styled', 'small-text')
    expect(small.message).toMatch(/renders at [\d.]+px/)
    expect(narrow.stdout).toMatch(/WARN \[small-text\] steps? /)
  })

  it('warns when the attribution is undersized', async () => {
    edit(path.join(dir, 'src/presentations/styled/style.css'), (css) => css.replace('font-size: 13px', 'font-size: 8px'))
    const rebuilt = await run('npm', ['run', 'build'], { cwd: dir })
    expect(rebuilt.code, rebuilt.output).toBe(0)
    const small = await run('npm', ['run', 'inspect', '--', 'styled', '--no-build', '--settle', '300'], { cwd: dir })
    expect(small.code, small.output).toBe(0)
    expect(warnings('styled', 'attribution')[0].message).toContain('too small')
  })
})
