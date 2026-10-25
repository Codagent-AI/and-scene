import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, copyRepo, edit, run } from '../helpers.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'

afterAll(cleanup)

const SCENE = `import { Appear, Label, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'

export interface Payload { stage: number }

export function Scene({ payload: { stage } }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Label id="base" at={{ x: 40, y: 40, w: 200, h: 20 }}>baseline text</Label>
      <Appear when={stage === 2} delay={1.2}>
        <Label id="late" at={{ x: 40, y: 300, w: 200, h: 20 }}>late arrival</Label>
      </Appear>
      <Appear when={stage === 2}>
        <Label id="clash-a" at={{ x: 300, y: 150, w: 240, h: 20 }}>colliding text one</Label>
        <Label id="clash-b" at={{ x: 320, y: 152, w: 240, h: 20 }}>colliding text two</Label>
      </Appear>
      <Appear when={stage === 3}>
        <div data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}>
          <Label id="ok-a" at={{ x: 300, y: 250, w: 240, h: 20 }}>intentional layer one</Label>
          <Label id="ok-b" at={{ x: 320, y: 252, w: 240, h: 20 }}>intentional layer two</Label>
        </div>
      </Appear>
    </SceneLayer>
  )
}
`

const talk = (slug, css) => `import { Presentation, type Step } from '../../presentation-kit/index.ts'
import { Scene, type Payload } from './Scene.tsx'
${css ? "import './styles.css'\n" : ''}
const steps: Step<Payload>[] = [1, 2, 3].map((stage) => ({
  id: 's' + stage, era: 'e', title: 'Step ' + stage, caption: 'Caption ' + stage,
  groupKey: '${slug}', Scene, payload: { stage },
}))

export default function Talk() {
  return <Presentation steps={steps} title="${slug}" initialMode="browse" />
}
`

const POLISH = `[data-presentation-progress-item] { width: 10px; height: 10px; border: 1px solid #333; background: #fff; padding: 0; }
[data-presentation-progress-item][data-active='true'] { width: 28px; background: #c8501e; border-color: #c8501e; }
[data-presentation-toc-item][data-active='true'] { font-weight: 700; background: #fde7dc; }
[data-presentation-attribution] { font-size: 13px; font-family: ui-sans-serif, sans-serif; color: #c8501e; text-decoration: none; }
`

function addFixture(dir, slug, css) {
  const folder = path.join(dir, 'src/presentations', slug)
  mkdirSync(folder, { recursive: true })
  writeFileSync(path.join(folder, 'Scene.tsx'), SCENE)
  writeFileSync(path.join(folder, 'Talk.tsx'), talk(slug, css))
  if (css) writeFileSync(path.join(folder, 'styles.css'), css)
  edit(path.join(dir, 'src/presentations/index.ts'), (s) =>
    s.replace('// presentations:end', `{ slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk.tsx') },\n  // presentations:end`),
  )
}

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  const dir = copyRepo()
  const SETTLE = 500
  const results = {}

  const inspect = (slug) => run(process.execPath, ['scripts/inspect-presentation.mjs', slug, '--skip-build', '--settle', String(SETTLE)], { cwd: dir })
  const report = (slug) => JSON.parse(readFileSync(path.join(dir, '.presentation-inspect', slug, 'report.json'), 'utf8'))

  beforeAll(async () => {
    addFixture(dir, 'fixture-rough', '')
    addFixture(dir, 'fixture-polished', POLISH)
    const build = await run('npm', ['run', 'build'], { cwd: dir })
    expect(build.code, build.out).toBe(0)
    results.rough = await inspect('fixture-rough')
    results.polished = await inspect('fixture-polished')
  })

  it('writes one predictable screenshot per step', () => {
    expect(results.rough.code, results.rough.out).toBe(0)
    for (const n of ['01', '02', '03']) {
      const file = path.join(dir, '.presentation-inspect/fixture-rough', `step-${n}.png`)
      expect(existsSync(file), file).toBe(true)
      expect(statSync(file).size).toBeGreaterThan(1000)
    }
    expect(existsSync(path.join(dir, '.presentation-inspect/fixture-rough/step-04.png'))).toBe(false)
  })

  it('captures only after the settle interval has elapsed for every step', () => {
    for (const c of report('fixture-rough').captures) expect(c.capturedAt - c.advancedAt).toBeGreaterThanOrEqual(SETTLE)
  })

  it('keeps waiting past the settle interval until entity motion has actually finished', () => {
    // Step 1 introduces a newcomer behind a 1.2s delay plus the enter delay and fade: far beyond the 500ms interval.
    const second = report('fixture-rough').captures[1]
    expect(second.capturedAt - second.advancedAt).toBeGreaterThanOrEqual(2000)
    expect(results.rough.out).not.toMatch(/still running/)
  })

  it('warns about the unmarked collision on its own step only', () => {
    const out = results.rough.out
    expect(out).toMatch(/WARN step 1: unmarked overlap between .*colliding text one.* and .*colliding text two/)
    expect(out).not.toMatch(/WARN step 0: unmarked overlap/)
  })

  it('does not warn about the explicitly allowed overlap', () => {
    expect(results.rough.out).not.toMatch(/WARN step 2: unmarked overlap/)
    expect(results.rough.out).not.toMatch(/intentional layer/)
  })

  it('warns about indistinct active chrome and unpolished attribution on each step', () => {
    for (const step of [0, 1, 2]) {
      expect(results.rough.out).toContain(`WARN step ${step}: active progress indicator`)
      expect(results.rough.out).toMatch(new RegExp(`WARN step ${step}: attribution .*\\[data-presentation-attribution\\]`))
    }
  })

  it('stays quiet about chrome once the presentation styles it locally', () => {
    expect(results.polished.code, results.polished.out).toBe(0)
    expect(results.polished.out).not.toMatch(/indistinct|attribution/)
    expect(results.polished.out).toContain('1 advisory warning(s)') // only the fixture's deliberate collision
  })
})
