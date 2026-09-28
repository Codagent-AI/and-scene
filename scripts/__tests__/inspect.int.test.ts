// @vitest-environment node
// INT-002: the screenshot helper writes one settled screenshot per step and emits the advisory warnings.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildFixtureApp, makeCopy, run } from './copy'

let app: string

const STYLED_CHROME = `
.presentation-progress-item { width: 10px; height: 10px; border: 1px solid currentColor; border-radius: 50%; background: transparent; opacity: .5; }
.presentation-progress-item[data-presentation-active='true'] { background: currentColor; opacity: 1; }
.presentation-toc-item { opacity: .6; }
.presentation-toc-item[data-presentation-active='true'] { opacity: 1; font-weight: 700; }
`
const STYLED_ATTRIBUTION = `.presentation-attribution { font-size: 13px; color: #444; text-decoration: none; }`
/** Step 2's collision fades in after 2500 ms, so it is only visible once the transition has settled. */
const COLLISION = `
.fx-a, .fx-b { position: absolute; left: 100px; font-size: 20px; animation: fx-in 1ms 2500ms both; }
.fx-a { top: 100px; } .fx-b { top: 106px; }
@keyframes fx-in { from { opacity: 0 } to { opacity: 1 } }
`

interface Fixture {
  slug: string
  css: string
  /** Marks the step-2 collision as intentional. */
  allow?: boolean
  /** Renders step 2 without any colliding text. */
  clean?: boolean
}

const FIXTURES: Fixture[] = [
  { slug: 'fx-clean', css: COLLISION + STYLED_CHROME + STYLED_ATTRIBUTION, clean: true },
  { slug: 'fx-collision', css: COLLISION + STYLED_CHROME + STYLED_ATTRIBUTION },
  { slug: 'fx-allowed', css: COLLISION + STYLED_CHROME + STYLED_ATTRIBUTION, allow: true },
  { slug: 'fx-chrome', css: COLLISION, clean: true },
  { slug: 'fx-tiny', css: COLLISION + STYLED_CHROME + `.presentation-attribution { font-size: 8px; color: #444; }`, clean: true },
]

function writeFixture(dir: string, f: Fixture) {
  const folder = join(dir, 'src/presentations', f.slug)
  mkdirSync(folder, { recursive: true })
  const overlap = `<><div className="fx-a">Alpha heading</div><div className="fx-b">Beta heading</div></>`
  writeFileSync(join(folder, 'fx.css'), f.css)
  writeFileSync(
    join(folder, 'Talk.tsx'),
    `import { Presentation, SceneLayer, type SceneProps } from '../../presentation-kit'
import './fx.css'
function Scene({ payload }: SceneProps<number>) {
  return <SceneLayer>{${f.clean ? '' : `payload === 2 && <div key="o"${f.allow ? ' data-presentation-allow-overlap=""' : ''}>${overlap}</div>`}}<div key="t" style={{ position: 'absolute', left: 20, top: 20 }}>Step {payload}</div></SceneLayer>
}
const steps = [1, 2].map((n) => ({ id: 's' + n, era: n === 1 ? 'one' : 'two', title: 'Title ' + n, caption: 'Caption ' + n, groupKey: 'g', Scene, payload: n }))
export default function Talk() {
  return <Presentation steps={steps} title="Fixture" initialMode="browse" />
}
`,
  )
}

const inspect = (slug: string, ...extra: string[]) =>
  run('node', ['scripts/inspect-presentation.mjs', slug, '--skip-build', '--settle', '3200', ...extra], app, 120_000)
const warnings = (output: string) => output.split('\n').filter((l) => l.startsWith('WARNING'))

beforeAll(() => {
  app = makeCopy('and-scene-inspect')
  for (const f of FIXTURES) writeFixture(app, f)
  const build = buildFixtureApp(app, FIXTURES.map((f) => f.slug))
  expect(build.status, build.output).toBe(0)
}, 300_000)

afterAll(() => rmSync(app, { recursive: true, force: true }))

describe('INT-002 screenshot helper', () => {
  it('writes one predictable screenshot per step and stays quiet for a polished presentation', () => {
    const { status, output } = inspect('fx-clean')
    expect(status, output).toBe(0)
    for (const n of ['01', '02']) expect(existsSync(join(app, '.inspection/fx-clean', `step-${n}.png`))).toBe(true)
    expect(existsSync(join(app, '.inspection/fx-clean/step-03.png'))).toBe(false)
    expect(warnings(output), output).toEqual([])
    expect(output).toContain('inspect: no advisory warnings')
  }, 150_000)

  it('names the step and elements of an unmarked collision, after the transition settles (the collision appears 2.5 s after the step change)', () => {
    const { status, output } = inspect('fx-collision')
    expect(status, output).toBe(0)
    const found = warnings(output)
    expect(found.filter((w) => w.includes('step 2: overlap:') && w.includes('Alpha heading') && w.includes('Beta heading')), output).toHaveLength(1)
    expect(found.some((w) => w.includes('step 1:'))).toBe(false)
  }, 150_000)

  it('does not warn about overlap inside an allow-overlap subtree', () => {
    const { status, output } = inspect('fx-allowed')
    expect(status, output).toBe(0)
    expect(warnings(output).filter((w) => w.includes('overlap:')), output).toEqual([])
  }, 150_000)

  it('reports indistinct active chrome and browser-default, undersized attribution', () => {
    const { status, output } = inspect('fx-chrome')
    expect(status, output).toBe(0)
    const found = warnings(output).join('\n')
    expect(found).toMatch(/chrome: active progress indicator looks identical/)
    expect(found).toMatch(/chrome: active table-of-contents entry looks identical/)
    expect(found).toMatch(/attribution: still uses the browser-default link color/)
    expect(found).toContain('.presentation-attribution')
  }, 150_000)

  it('reports undersized attribution', () => {
    const { status, output } = inspect('fx-tiny')
    expect(status, output).toBe(0)
    expect(warnings(output).join('\n')).toMatch(/attribution: font-size 8px is too small/)
    expect(warnings(output).some((w) => w.includes('chrome:'))).toBe(false)
  }, 150_000)
})
