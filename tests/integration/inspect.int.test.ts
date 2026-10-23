import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startPreview } from '../../scripts/lib/preview.mjs'
import { cleanupTmpDirs, copyRepo, edit, isListening, previewPorts, run } from './helpers.ts'

afterAll(cleanupTmpDirs)

const SETTLE = 1300

/** One registered fixture presentation: three steps, optionally styled, with a collision on step 2 that step 3 marks as intentional. */
function fixture(slug: string, { css, attribution }: { css: boolean; attribution: boolean }) {
  const cssImport = css ? `import './${slug}.css'\n` : ''
  const talk = `import { ALLOW_OVERLAP, Appear, Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit/index.ts'
${cssImport}
interface P { step: number }

function Scene({ payload }: SceneProps<P>) {
  return (
    <SceneLayer>
      <Appear key="base"><Label id="base" style={{ left: 40, top: 40 }}>Base label</Label></Appear>
      {payload.step === 2 ? (
        <Appear key="collide">
          <Label id="alpha" style={{ left: 300, top: 150 }}>Alpha collision text</Label>
          <Label id="beta" style={{ left: 310, top: 152 }}>Beta collision text</Label>
        </Appear>
      ) : null}
      {payload.step === 3 ? (
        <Appear key="intentional">
          <div {...ALLOW_OVERLAP}>
            <Label id="gamma" style={{ left: 300, top: 150 }}>Gamma readable overlap</Label>
            <Label id="delta" style={{ left: 310, top: 152 }}>Delta readable overlap</Label>
          </div>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}

const steps: Step<P>[] = [1, 2, 3].map((n) => ({ id: 's' + n, era: n < 3 ? 'first era' : 'second era', title: 'Step ' + n, caption: 'Caption ' + n, Scene, groupKey: 'g', payload: { step: n } }))

export default function Talk() {
  return <div className="${slug}"><Presentation steps={steps} title="${slug}" attribution={${attribution ? 'undefined' : 'null'}} /></div>
}
`
  const styles = `.${slug} [data-presentation-dot] { width: 10px; height: 10px; padding: 0; border: 2px solid #555; border-radius: 999px; background: transparent; }
.${slug} [data-presentation-dot][data-presentation-active] { width: 30px; border-color: #c60; background: #c60; }
.${slug} [data-presentation-toc-entry] { background: transparent; border: 0; color: #444; }
.${slug} [data-presentation-toc-entry][data-presentation-active] { background: #fd9; color: #000; font-weight: 700; }
.${slug} [data-presentation-attribution] { font-size: 14px; color: #a40; }
.${slug} [data-presentation-caption] { height: 3em; overflow: hidden; }
`
  return { talk, styles }
}

const VARIANTS = {
  'fx-plain': { css: false, attribution: true },
  'fx-polished': { css: true, attribution: true },
  'fx-noattr': { css: true, attribution: false },
}

let dir: string
const results: Record<string, ReturnType<typeof run>> = {}
let narrow: ReturnType<typeof run>
const report = (slug: string, viewport = '1440x900') => JSON.parse(fs.readFileSync(path.join(dir, '.inspection', slug, viewport, 'report.json'), 'utf8'))
const warnings = (slug: string) => (results[slug].stdout.match(/^WARN .*$/gm) ?? []) as string[]

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  beforeAll(() => {
    dir = copyRepo('inspect')
    for (const [slug, options] of Object.entries(VARIANTS)) {
      const { talk, styles } = fixture(slug, options)
      fs.mkdirSync(path.join(dir, 'src/presentations', slug))
      fs.writeFileSync(path.join(dir, 'src/presentations', slug, 'Talk.tsx'), talk)
      if (options.css) fs.writeFileSync(path.join(dir, 'src/presentations', slug, `${slug}.css`), styles)
      edit(path.join(dir, 'src/presentations/index.ts'), (s) => s.replace(/\n\]/, `\n  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk.tsx') },\n]`))
    }
    const build = run('npm', ['run', 'build'], { cwd: dir })
    if (build.status !== 0) throw new Error(build.output)
    for (const slug of Object.keys(VARIANTS)) results[slug] = run('npm', ['run', 'inspect', '--', slug, '--no-build', '--settle', String(SETTLE)], { cwd: dir })
    narrow = run('npm', ['run', 'inspect', '--', 'fx-polished', '--no-build', '--settle', String(SETTLE), '--viewport', '390x844'], { cwd: dir })
  })

  it('writes exactly one valid, nonempty screenshot per step at the standard desktop viewport', () => {
    for (const slug of Object.keys(VARIANTS)) {
      expect(results[slug].status, results[slug].output).toBe(0)
      const folder = path.join(dir, '.inspection', slug, '1440x900')
      expect(fs.readdirSync(folder).filter((f) => f.endsWith('.png')).sort()).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
      for (const file of fs.readdirSync(folder).filter((f) => f.endsWith('.png'))) {
        const bytes = fs.readFileSync(path.join(folder, file))
        expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
        expect(bytes.readUInt32BE(16)).toBe(1440)
        expect(bytes.readUInt32BE(20)).toBe(900)
        expect(bytes.length).toBeGreaterThan(2000)
      }
    }
  })

  it('supports a narrow viewport in its own predictable folder', () => {
    expect(narrow.status, narrow.output).toBe(0)
    const bytes = fs.readFileSync(path.join(dir, '.inspection/fx-polished/390x844/step-03.png'))
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([390, 844])
  })

  it('captures every step, including the first, only after the configured settle interval', () => {
    for (const slug of Object.keys(VARIANTS)) {
      const { captures } = report(slug)
      expect(captures).toHaveLength(3)
      for (const capture of captures) {
        expect(capture.settleMs).toBe(SETTLE)
        expect(capture.capturedAt - capture.advancedAt).toBeGreaterThanOrEqual(SETTLE)
      }
    }
  })

  it('reports the unmarked collision on its step, naming both elements', () => {
    const overlap = warnings('fx-polished').filter((w) => w.includes(' overlap:'))
    expect(overlap).toHaveLength(1)
    expect(overlap[0]).toMatch(/^WARN \[advisory\] step 2 overlap: .*Alpha collision text.*overlaps .*Beta collision text/)
  })

  it('does not report the overlap inside the allow-overlap subtree', () => {
    expect(warnings('fx-polished').join('\n')).not.toMatch(/Gamma|Delta|step 3 overlap/)
  })

  it('reports indistinct active progress and ToC chrome and an unpolished attribution for the unstyled fixture', () => {
    const joined = warnings('fx-plain').join('\n')
    expect(joined).toMatch(/step 1 active-progress: .*data-presentation-dot/)
    expect(joined).toMatch(/step 1 active-toc: .*data-presentation-toc-entry/)
    expect(joined).toMatch(/step 1 attribution: .*browser-default link color.*data-presentation-attribution/)
  })

  it('reports no chrome warnings for the styled fixture', () => {
    expect(warnings('fx-polished').filter((w) => /active-|attribution/.test(w))).toEqual([])
  })

  it('reports a missing attribution', () => {
    expect(warnings('fx-noattr').join('\n')).toMatch(/step 1 attribution: attribution link is missing; .*data-presentation-attribution/)
  })

  it('labels warnings advisory and keeps a zero exit status', () => {
    for (const slug of Object.keys(VARIANTS)) {
      expect(results[slug].status).toBe(0)
      expect(results[slug].stdout).toMatch(/advisory warning\(s\); advisory warnings never change the exit code/)
    }
    expect(warnings('fx-plain').length).toBeGreaterThan(0)
    expect(warnings('fx-plain').every((w) => w.startsWith('WARN [advisory]'))).toBe(true)
  })

  it('stops its preview server when it finishes', async () => {
    for (const port of previewPorts(results['fx-plain'].output)) expect(await isListening(port)).toBe(false)
  })

  it('fails (not advisory) for a presentation that does not exist', () => {
    const missing = run('npm', ['run', 'inspect', '--', 'no-such-talk', '--no-build', '--settle', '10'], { cwd: dir })
    expect(missing.status).not.toBe(0)
    expect(missing.output).toMatch(/INSPECT FAIL/)
  })
})

describe('scene transitions in a real browser', () => {
  it('keeps one fit scale on every step even when captions wrap differently', async () => {
    const dirCopy = copyRepo('fitscale')
    fs.mkdirSync(path.join(dirCopy, 'src/presentations/fx-scale'))
    fs.writeFileSync(
      path.join(dirCopy, 'src/presentations/fx-scale/Talk.tsx'),
      `import { Presentation, type Step } from '../../presentation-kit/index.ts'
const Scene = () => null
const captions = ['short', 'a much longer caption '.repeat(40), 'medium length caption '.repeat(6), 'x']
const steps: Step[] = captions.map((caption, i) => ({ id: 's' + i, era: 'e' + (i % 2), title: 'T'.repeat(1 + i * 30), caption, Scene }))
export default function Talk() { return <Presentation steps={steps} title="scale" /> }
`,
    )
    edit(path.join(dirCopy, 'src/presentations/index.ts'), (s) => s.replace(/\n\]/, `\n  { slug: 'fx-scale', title: 'scale', load: () => import('./fx-scale/Talk.tsx') },\n]`))
    const build = run('npm', ['run', 'build'], { cwd: dirCopy })
    expect(build.status, build.output).toBe(0)
    const preview = await startPreview(dirCopy, () => {})
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
      await page.goto(`http://127.0.0.1:${preview.port}/fx-scale`)
      await page.waitForSelector('[data-step-count]')
      const scales: string[] = []
      const heights: number[] = []
      for (let i = 0; i < 4; i++) {
        if (i > 0) await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(300)
        scales.push((await page.locator('[data-presentation-canvas]').getAttribute('data-presentation-scale')) ?? '')
        heights.push((await page.locator('[data-presentation-stage]').boundingBox())!.height)
      }
      expect(new Set(heights).size).toBeGreaterThan(1) // the chrome really did change height between steps
      expect(new Set(scales).size).toBe(1)
    } finally {
      await browser.close()
      await preview.stop()
    }
  })

  it('retires the outgoing scene after a cross-group transition that shares an entity id', async () => {
    const dirCopy = copyRepo('crossgroup')
    // two groups whose scenes both render the entity "shared": a shared-layout cross-fade
    fs.mkdirSync(path.join(dirCopy, 'src/presentations/fx-cross'))
    fs.writeFileSync(
      path.join(dirCopy, 'src/presentations/fx-cross/Talk.tsx'),
      `import { Box, Presentation, type SceneProps, type Step } from '../../presentation-kit/index.ts'
function One(_: SceneProps) { return <Box id="shared" style={{ left: 20, top: 20, width: 100, height: 50 }}>one</Box> }
function Two(_: SceneProps) { return <Box id="shared" style={{ left: 400, top: 200, width: 200, height: 80 }}>two</Box> }
const steps: Step[] = [
  { id: 'a', era: 'e', title: 'A', caption: 'a', Scene: One, groupKey: 'one' },
  { id: 'b', era: 'e', title: 'B', caption: 'b', Scene: Two, groupKey: 'two' },
]
export default function Talk() { return <Presentation steps={steps} title="cross" /> }
`,
    )
    edit(path.join(dirCopy, 'src/presentations/index.ts'), (s) => s.replace(/\n\]/, `\n  { slug: 'fx-cross', title: 'cross', load: () => import('./fx-cross/Talk.tsx') },\n]`))
    const build = run('npm', ['run', 'build'], { cwd: dirCopy })
    expect(build.status, build.output).toBe(0)
    const preview = await startPreview(dirCopy, () => {})
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      await page.goto(`http://127.0.0.1:${preview.port}/fx-cross`)
      await page.waitForSelector('[data-step-count]')
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(() => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === '1')
      await page.waitForFunction(() => document.querySelectorAll('[data-presentation-scene]').length === 1, undefined, { timeout: 5000 })
      expect(await page.locator('[data-presentation-entity="shared"]').textContent()).toBe('two')
      expect(errors).toEqual([])
    } finally {
      await browser.close()
      await preview.stop()
    }
  })
})
