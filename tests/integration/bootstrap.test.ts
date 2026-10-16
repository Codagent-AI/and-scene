import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SKILL, exists, makeTemp, materializeBootstrap, npmCi, removeDir, run, write } from './helpers.ts'

let app: string
const outside = makeTemp('outside')

beforeAll(() => {
  app = materializeBootstrap()
  npmCi(app)
}, 600_000)

afterAll(() => {
  removeDir(app)
  removeDir(outside)
})

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  it('has all three anchors and the complete dependency set after materializing from the skill dir', () => {
    const detected = JSON.parse(run('node', [join(SKILL, 'scripts/scaffold.mjs'), 'detect', app], outside).out)
    expect(detected.anchors).toEqual({ build: true, kit: true, index: true })
    expect(detected.needsScaffold).toBe(false)
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      expect(names).toContain(dep)
    }
    expect(names.filter((n) => /tailwind/i.test(n))).toEqual([])
  })

  it('lints, builds, and renders its registered route through its verify entry point', () => {
    expect(run('npm', ['run', 'lint'], app).code).toBe(0)
    const verify = run('npm', ['run', 'verify'], app)
    expect(verify.out).toContain('[verify] PASS')
    expect(verify.code).toBe(0)
    expect(verify.out).toMatch(/http:\/\/127\.0\.0\.1:\d+\/getting-started/)
  })

  it('keeps the kit aligned with canonical source and free of visual defaults', () => {
    const files = readdirSync(join(app, 'src/presentation-kit'), { recursive: true }).map(String).filter((f) => /\.tsx?$/.test(f))
    for (const f of files) {
      expect(readFileSync(join(app, 'src/presentation-kit', f), 'utf8')).toBe(readFileSync(join(process.cwd(), 'src/presentation-kit', f), 'utf8'))
    }
    expect(exists(app, 'tailwind.config.js')).toBe(false)
    expect(readFileSync(join(app, 'src/index.css'), 'utf8')).not.toMatch(/font-family|#[0-9a-f]{3,6}\b|background/i)
  })
})

// ---------------------------------------------------------------- INT-002

const CHROME_CSS = `
.fx [data-presentation-progress] { gap: 8px; }
.fx [data-presentation-dot] { width: 12px; height: 12px; border: 1px solid #555; border-radius: 50%; background: transparent; padding: 0; }
.fx [data-presentation-dot][data-active='true'] { background: #d33; border-color: #d33; transform: scale(1.5); }
.fx [data-presentation-toc-entry] { border: 0; background: transparent; color: #555; }
.fx [data-presentation-toc-entry][data-active='true'] { background: #fde; color: #000; font-weight: 700; }
.fx [data-presentation-attribution] { color: #d33; font: 13px monospace; text-decoration: none; }
.fx [data-role] { position: absolute; font: 16px sans-serif; }
`

/** A registered two-step fixture: step 2 adds a label that sits on top of the first. */
function fixture(slug: string, { css, wrap }: { css: boolean; wrap?: boolean }) {
  const collider = `<Box key="b" id="b" at={{ x: 150, y: 100, w: 200, h: 40 }} data-role="b">second colliding text</Box>`
  write(
    app,
    `src/presentations/${slug}/Talk.tsx`,
    `import { Box, Presentation, SceneLayer, defineStep, type SceneProps } from '../../presentation-kit/index.ts'
${css ? "import './styles.css'" : ''}

function Scene({ payload }: SceneProps<{ beat: number }>) {
  return (
    <SceneLayer>
      <Box key="a" id="a" at={{ x: 100, y: 100, w: 200, h: 40 }} data-role="a">first colliding text</Box>
      {payload.beat >= 2 && ${wrap ? `<div data-presentation-allow-overlap="">${collider}</div>` : collider}}
    </SceneLayer>
  )
}
const steps = [1, 2, 3].map((beat) =>
  defineStep({ id: 's' + beat, era: beat < 3 ? 'one' : 'two', title: 'Step ' + beat, caption: 'Caption ' + beat, Scene, groupKey: 'g', payload: { beat: beat === 3 ? 1 : beat } }),
)
export default function Talk() {
  return <div className="fx" style={{ height: '100%' }}><Presentation steps={steps} title="${slug}" /></div>
}
`,
  )
  if (css) write(app, `src/presentations/${slug}/styles.css`, CHROME_CSS)
}

describe('INT-002: screenshot helper emits artifacts and advisory warnings', () => {
  const SETTLE = 1100
  const slugs = { collision: 'fx-collision', allowed: 'fx-allowed', plain: 'fx-plain', late: 'fx-late', arrow: 'fx-arrow' }
  let registry: string

  beforeAll(() => {
    // Step 2's `beat: 2` text collides with step 1's text; step 3 returns to beat 1 (no collision).
    fixture(slugs.collision, { css: true })
    fixture(slugs.allowed, { css: true, wrap: true })
    fixture(slugs.plain, { css: false })
    fixture(slugs.late, { css: true })
    // Attribution is polished on step 1 only: step 2 shrinks it to 6px.
    write(app, `src/presentations/${slugs.late}/styles.css`, `${CHROME_CSS}\n.fx [data-presentation-root][data-step-index='1'] [data-presentation-attribution] { font-size: 6px; }\n`)
    write(app, `src/presentations/${slugs.late}/Talk.tsx`, readFileSync(join(app, `src/presentations/${slugs.late}/Talk.tsx`), 'utf8').replace('first colliding text', 'one').replace('second colliding text', 'two').replace('at={{ x: 150, y: 100', 'at={{ x: 500, y: 200'))
    // Two *separate* scenes (no groupKey) drawing the same arrow id with a different endpoint.
    write(
      app,
      `src/presentations/${slugs.arrow}/Talk.tsx`,
      `import { Arrow, Presentation, SceneLayer, defineStep } from '../../presentation-kit/index.ts'

const draw = (x: number) => function Scene() {
  return <SceneLayer><Arrow key="a" id="the-arrow" from={{ x: 100, y: 80 }} to={{ x, y: 80 }} /></SceneLayer>
}
const steps = [
  defineStep({ id: 'a', era: 'e', title: 'A', caption: 'a', Scene: draw(200), payload: undefined }),
  defineStep({ id: 'b', era: 'e', title: 'B', caption: 'b', Scene: draw(600), payload: undefined }),
]
export default function Talk() {
  return <div style={{ height: '100%' }}><Presentation steps={steps} title="arrow" /></div>
}
`,
    )
    registry = readFileSync(join(app, 'src/presentations/index.ts'), 'utf8')
    const entries = Object.values(slugs).map((s) => `  { slug: '${s}', title: '${s}', load: () => import('./${s}/Talk.tsx') },\n`).join('')
    write(app, 'src/presentations/index.ts', registry.replace(/\n\]/, `\n${entries}]`))
    const build = run('npm', ['run', 'build'], app)
    expect(build.code, build.out).toBe(0)
  })

  const inspect = (slug: string) => {
    const res = run('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle', String(SETTLE)], app)
    expect(res.code, res.out).toBe(0)
    const report = JSON.parse(readFileSync(join(app, '.presentation-inspect', slug, 'report.json'), 'utf8'))
    return { res, report, warnings: res.out.split('\n').filter((l) => l.startsWith('[inspect] warning')) }
  }

  it('writes one predictable screenshot per step, captured only after the settle interval', () => {
    const { report } = inspect(slugs.collision)
    expect(report.steps).toHaveLength(3)
    for (const [i, s] of report.steps.entries()) {
      expect(s.file).toBe(join(app, '.presentation-inspect', slugs.collision, `step-0${i + 1}.png`))
      expect(exists(app, `.presentation-inspect/${slugs.collision}/step-0${i + 1}.png`)).toBe(true)
      expect(s.capturedAt - s.pressedAt).toBeGreaterThanOrEqual(SETTLE)
    }
  })

  it('reports the unmarked collision for step 2 only, and nothing for polished chrome', () => {
    const { warnings } = inspect(slugs.collision)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatch(/step 2 overlap: "first colliding text" overlaps "second colliding text"/)
  })

  it('exempts a subtree marked allow-overlap', () => {
    expect(inspect(slugs.allowed).warnings).toEqual([])
  })

  it('reports an attribution defect that only appears after step 1', () => {
    const { warnings } = inspect(slugs.late)
    expect(warnings.filter((w) => /attribution/.test(w))).toHaveLength(1)
    expect(warnings.join('\n')).toMatch(/step 2 attribution: .*font-size 6px is too small/)
  })

  it('morphs a stable arrow id between separate steps instead of only cross-fading', async () => {
    const { startPreview, launchBrowser } = await import(join(app, 'scripts/lib.mjs'))
    const preview = await startPreview()
    const browser = await launchBrowser()
    try {
      const page = await browser.newPage()
      await page.goto(`${preview.base}/${slugs.arrow}`)
      await page.waitForSelector('[data-presentation-node="arrow"]')
      await page.waitForTimeout(1500)
      await page.keyboard.press('ArrowRight')
      const seen = new Set<string>()
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(40)
        for (const d of await page.$$eval('[data-presentation-node="arrow"] path[stroke]', (ps) => ps.map((p) => p.getAttribute('d') ?? ''))) seen.add(d)
      }
      const ends = [...seen].map((d) => Number(/L (\d+(?:\.\d+)?) /.exec(d)?.[1]))
      expect(ends.some((x) => x > 205 && x < 595), `intermediate endpoints: ${ends}`).toBe(true)
    } finally {
      await browser.close()
      preview.stop()
    }
  })

  it('reports indistinct active chrome and unpolished attribution with their styling hooks', () => {
    const { warnings } = inspect(slugs.plain)
    const text = warnings.join('\n')
    expect(text).toMatch(/step 1 active-nav: active progress indicator .*data-presentation-dot/)
    expect(text).toMatch(/step 1 active-nav: active table-of-contents entry .*data-presentation-toc-entry/)
    expect(text).toMatch(/step 1 attribution: .*data-presentation-attribution/)
  })
})
