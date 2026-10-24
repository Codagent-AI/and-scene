import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, edit, processExists, remove, run } from '../support/repoCopy.ts'

/**
 * INT-002: the project-local inspection helper drives a production preview of controlled
 * presentations and writes screenshots plus advisory diagnostics.
 */
let dir = ''
beforeAll(async () => {
  dir = copyRepo()
  const slugs: string[] = []
  const add = (slug: string, { scene, css = CLEAN_CSS, attribution = '' }: { scene: string; css?: string; attribution?: string }) => {
    slugs.push(slug)
    const base = path.join(dir, 'src/presentations', slug)
    mkdirSync(base, { recursive: true })
    writeFileSync(path.join(base, 'style.css'), css)
    writeFileSync(
      path.join(base, 'Talk.tsx'),
      `import { useEffect, useState } from 'react'
import { Presentation, type SceneProps, type Step } from '../../presentation-kit/index.ts'
import './style.css'
function Settling({ n }: { n: number }) {
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    setSettled(false)
    const id = setTimeout(() => setSettled(true), 1500)
    return () => clearTimeout(id)
  }, [n])
  return <div data-testid="block" style={{ position: 'absolute', left: 0, top: 0, width: 880, height: 380, background: settled ? '#00ff00' : '#ff0000' }} />
}
function Boom() {
  useEffect(() => console.error('inspect-fixture-error'), [])
  return null
}
export const helpers = [Settling, Boom]
function Scene({ payload }: SceneProps<{ n: number }>) {
  return <div data-testid="scene" style={{ position: 'absolute', inset: 0 }}>${scene}</div>
}
const STEPS: Step<{ n: number }>[] = [
  { id: 'one', era: 'first', title: 'One', caption: 'Step one.', groupKey: 'g', Scene, payload: { n: 1 } },
  { id: 'two', era: 'second', title: 'Two', caption: 'Step two.', groupKey: 'g', Scene, payload: { n: 2 } },
]
export default function Talk() {
  return <Presentation steps={STEPS} title="${slug}" ${attribution} />
}
`,
    )
  }

  // Overlapping text appears only on step 2.
  const overlap = (marker: string) => `<>
    <p style={{ position: 'absolute', left: 100, top: 100, margin: 0 }}>First line of text</p>
    {payload.n === 2 ? <div ${marker} data-testid="zone"><p style={{ position: 'absolute', left: 110, top: 104, margin: 0 }}>Second line on top</p></div> : null}
  </>`
  // A block that turns lime only 1500ms after the step changes (proves captures wait for settling).
  const settling = `<Settling n={payload.n} />`

  add('insp-clean', { scene: `<p style={{ position: 'absolute', left: 100, top: 100, margin: 0 }}>A calm step {payload.n}</p>` })
  add('insp-collision', { scene: overlap('') })
  add('insp-allowed', { scene: overlap('data-presentation-allow-overlap=""') })
  add('insp-indistinct', { scene: `<p>step {payload.n}</p>`, css: ATTRIBUTION_CSS })
  add('insp-attr-default', { scene: `<p>step {payload.n}</p>`, css: ACTIVE_CSS })
  add('insp-attr-small', { scene: `<p>step {payload.n}</p>`, css: ACTIVE_CSS + '[data-presentation-attribution]{font-size:9px;color:#ccc}' })
  add('insp-attr-missing', { scene: `<p>step {payload.n}</p>`, css: ACTIVE_CSS, attribution: 'attribution={false}' })
  // A chrome-hooked control whose box (not its label) is hit by unrelated text.
  add('insp-control-box', {
    scene: `<>
      <button data-presentation-next="" style={{ position: 'absolute', left: 100, top: 200, width: 240, height: 80 }}>ok</button>
      {payload.n === 2 ? <p style={{ position: 'absolute', left: 104, top: 204, margin: 0 }}>edge text</p> : null}
    </>`,
  })
  // Text that overlaps only inside an invisible (opacity 0) subtree must not be reported.
  add('insp-hidden', {
    scene: `<>
      <p style={{ position: 'absolute', left: 100, top: 100, margin: 0 }}>visible line</p>
      <div style={{ opacity: 0 }}><p style={{ position: 'absolute', left: 104, top: 104, margin: 0 }}>invisible line</p></div>
    </>`,
  })
  add('insp-settling', { scene: settling, css: CLEAN_CSS })
  add('insp-error', { scene: `<p>step {payload.n}</p>{payload.n === 2 ? <Boom /> : null}` })

  edit(dir, 'src/presentations/index.ts', (t) =>
    t.replace('\n]', `\n${slugs.map((s) => `  { slug: '${s}', title: '${s}', load: () => import('./${s}/Talk.tsx') },`).join('\n')}\n]`),
  )
  const build = await run('npm', ['run', 'build'], dir)
  expect(build.code, build.output).toBe(0)
}, 300000)

afterAll(() => remove(dir))

const BASE = `[data-presentation-attribution]{font-size:13px;color:#ccc}`
const ACTIVE_CSS = `[data-presentation-progress]{gap:12px}\n[data-presentation-progress-item][data-presentation-active]{background:#fc0;transform:scale(1.5)}
[data-presentation-toc-item][data-presentation-active]{font-weight:700;color:#fc0}`
const ATTRIBUTION_CSS = BASE
const CLEAN_CSS = `${BASE}\n${ACTIVE_CSS}`

let runs = 0
// Each run writes to its own directory (a later --out wins) so concurrent runs never share files.
const inspect = (slug: string, extra: string[] = []) =>
  run('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle', '700', '--out', `.out-${runs++}`, ...extra], dir)
const warnings = (output: string) => output.split('\n').filter((l) => l.startsWith('WARN'))

describe('screenshots (M-68)', () => {
  it.concurrent('writes one valid desktop screenshot per step under a predictable path, with distinct states', async () => {
    const result = await inspect('insp-clean', ['--out', '.inspection'])
    expect(result.code, result.output).toBe(0)
    const files = ['step-01.png', 'step-02.png'].map((f) => path.join(dir, '.inspection/insp-clean', f))
    const sizes = files.map((f) => statSync(f).size)
    expect(sizes.every((s) => s > 2000)).toBe(true)
    expect(readFileSync(files[0]).subarray(1, 4).toString()).toBe('PNG')
    expect(readFileSync(files[0]).equals(readFileSync(files[1]))).toBe(false) // step 1 and 2 differ
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      await page.goto(`file://${files[0]}`)
      expect(await page.evaluate(() => [document.images[0].naturalWidth, document.images[0].naturalHeight])).toEqual([1280, 800])
    } finally {
      await browser.close()
    }
    expect(result.output).toMatch(/2 screenshots for \/insp-clean \(1280x800\)/)
  })

  it.concurrent('captures a second, narrow pass on request', async () => {
    const result = await inspect('insp-clean', ['--narrow', '--out', '.inspection-narrow'])
    expect(result.code, result.output).toBe(0)
    expect(statSync(path.join(dir, '.inspection-narrow/insp-clean/narrow/step-02.png')).size).toBeGreaterThan(1000)
    expect(result.output).toMatch(/\(390x844\)/)
  })

})

describe('settled captures (M-69)', () => {
  const lime = async (file: string) => {
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      await page.goto(`file://${file}`)
      return await page.evaluate(() => {
        const img = document.images[0]
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        // the block is centred in the stage; sample around the page centre
        const [r, g, b] = ctx.getImageData(img.naturalWidth / 2, img.naturalHeight / 2 - 40, 1, 1).data
        return { r, g, b }
      })
    } finally {
      await browser.close()
    }
  }

  it.concurrent('captures only after the transition has settled (and would catch an unsettled capture)', async () => {
    const settled = await inspect('insp-settling', ['--settle', '2200', '--out', '.inspection-settled'])
    expect(settled.code, settled.output).toBe(0)
    for (const f of ['step-01.png', 'step-02.png']) {
      const px = await lime(path.join(dir, '.inspection-settled/insp-settling', f))
      expect(px, f).toMatchObject({ r: 0, g: 255, b: 0 })
    }
    const rushed = await inspect('insp-settling', ['--settle', '0', '--out', '.inspection-rushed'])
    expect(rushed.code, rushed.output).toBe(0)
    const px = await lime(path.join(dir, '.inspection-rushed/insp-settling/step-02.png'))
    expect(px.g === 255 && px.r === 0).toBe(false) // control: no settle interval => not yet settled
  })
})

describe('advisory warnings (M-70..M-74, C-02)', () => {
  it.concurrent('produces no warnings for a carefully styled presentation', async () => {
    const result = await inspect('insp-clean')
    expect(warnings(result.output)).toEqual([])
    expect(result.output).toMatch(/0 advisory warning\(s\)/)
  })

  it.concurrent('reports the unmarked collision on step 2 only, naming both elements, and exits zero', async () => {
    const result = await inspect('insp-collision')
    expect(result.code, result.output).toBe(0)
    const lines = warnings(result.output)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^WARN step 2 \[overlap\] .*First line of text.* overlaps .*Second line on top/)
  })

  it.concurrent('reports text that collides with the box of a control, not only with its label', async () => {
    const result = await inspect('insp-control-box')
    expect(result.code, result.output).toBe(0)
    const lines = warnings(result.output).filter((l) => l.includes('[overlap]'))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^WARN step 2 \[overlap\] .*edge text/)
  })

  it.concurrent('ignores text inside an invisible (opacity 0) subtree', async () => {
    const result = await inspect('insp-hidden')
    expect(result.code, result.output).toBe(0)
    expect(warnings(result.output)).toEqual([])
  })

  it.concurrent('does not warn for an overlap inside an explicit allow-overlap subtree', async () => {
    const result = await inspect('insp-allowed')
    expect(result.code, result.output).toBe(0)
    expect(warnings(result.output)).toEqual([])
  })

  it.concurrent('reports indistinct active progress and ToC chrome on every step', async () => {
    const result = await inspect('insp-indistinct')
    expect(result.code, result.output).toBe(0)
    const lines = warnings(result.output)
    for (const step of [1, 2]) {
      expect(lines.some((l) => l.startsWith(`WARN step ${step} [active-progress]`)), `progress ${step}`).toBe(true)
      expect(lines.some((l) => l.startsWith(`WARN step ${step} [active-toc]`)), `toc ${step}`).toBe(true)
    }
    expect(lines.some((l) => l.includes('[attribution]'))).toBe(false)
  })

  it.concurrent.each([
    ['insp-attr-default', /browser-default link color/],
    ['insp-attr-small', /too small \(9px\)/],
    ['insp-attr-missing', /is missing/],
  ])('reports unpolished attribution (%s) with the styling hook on each step', async (slug, issue) => {
    const result = await inspect(slug)
    expect(result.code, result.output).toBe(0)
    const lines = warnings(result.output)
    expect(lines).toHaveLength(2)
    lines.forEach((line, i) => {
      expect(line).toMatch(new RegExp(`^WARN step ${i + 1} \\[attribution\\]`))
      expect(line).toMatch(issue)
      expect(line).toContain('[data-presentation-attribution]')
    })
  })
})

describe('runtime errors (self-verification of the target route)', () => {
  it.concurrent('fails the helper and names the step when the presentation logs a console error', async () => {
    const result = await inspect('insp-error')
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/ERROR step 2: console\.error: inspect-fixture-error/)
  })

  it.concurrent('fails when the route renders no presentation', async () => {
    const result = await inspect('does-not-exist')
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/no presentation rendered at \/does-not-exist/)
  })
})

describe('cleanup', () => {
  it('leaves no preview process behind', async () => {
    expect(await processExists(path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js') + ' preview')).toBe(false)
  })
})
