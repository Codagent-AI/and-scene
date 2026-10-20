// INT-002: the screenshot helper emits faithful artifacts and advisory warnings.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, exists, run } from './helpers.ts'

const SLUG = 'inspect-fixture'
let root = ''
let result = { status: 0 as number | null, output: '' }
const lines = () => result.output.split('\n')
const warnings = (step: number) => lines().filter((l) => l.startsWith(`WARN step ${step}:`))

const SCENE = `import { createPortal } from 'react-dom'
import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer.tsx'
import type { SceneProps } from '../../presentation-kit/types.ts'

export interface P { step: number }
const at = (left: number, top: number) => ({ position: 'absolute' as const, left, top, width: 220, height: 40 })

export function Scene({ payload }: SceneProps<P>) {
  return (
    <>
    <SceneLayer>
      {payload.step === 3 ? (
        <div data-presentation-allow-overlap="">
          <div style={at(40, 40)}>gamma intentionally layered</div>
          <div style={at(80, 55)}>delta intentionally layered</div>
        </div>
      ) : (
        <div style={at(40, 40)}>
          alpha clean text
          {payload.step === 6 ? <span style={{ position: 'absolute', left: 20, top: 0 }}>nested child overprint</span> : null}
        </div>
      )}
      {payload.step === 2 ? <div style={at(80, 55)}>beta collides with alpha</div> : null}
    </SceneLayer>
      {createPortal(<div key={payload.step} data-probe="" style={{ position: 'fixed', left: 0, top: 0, width: 20, height: 20, zIndex: 99999 }} />, document.body)}
    </>
  )
}
`
const TALK = `import { Presentation } from '../../presentation-kit/Presentation.tsx'
import type { Step } from '../../presentation-kit/types.ts'
import './talk.css'
import { Scene, type P } from './Scene.tsx'

const steps: Step<P>[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: 's' + n,
  era: n < 3 ? 'first' : 'second',
  title: 'Step ' + n,
  caption: 'Caption ' + n,
  groupKey: 'g',
  Scene,
  payload: { step: n },
}))

export default function Talk() {
  return <Presentation steps={steps} title="Inspect fixture" />
}
`
// Progress items are left unstyled (indistinct). The ToC's active entry is styled only on the first two steps;
// afterwards it is unstyled while its era label ('second') is wider than 'first' (natural size difference).
// The probe turns from red to green over 600 ms after every step change.
const CSS = `[data-step-index='0'] [data-presentation-toc-item][data-presentation-active='true'],
[data-step-index='1'] [data-presentation-toc-item][data-presentation-active='true'] { background: #fc0; font-weight: 700; }
@keyframes probe { from { background: #f00; } to { background: #0f0; } }
[data-probe] { background: #f00; animation: probe 600ms linear forwards; }
[data-presentation-attribution] { font-size: 13px; color: #333; text-decoration: none; }
[data-step-index='3'] [data-presentation-attribution] { font-size: 9px; }
[data-step-index='4'] [data-presentation-attribution] { all: revert; }
`

beforeAll(() => {
  root = copyRepo()
  const dir = path.join(root, 'src/presentations', SLUG)
  run('mkdir', ['-p', dir], root)
  writeFileSync(path.join(dir, 'Scene.tsx'), SCENE)
  writeFileSync(path.join(dir, 'Talk.tsx'), TALK)
  writeFileSync(path.join(dir, 'talk.css'), CSS)
  const registry = path.join(root, 'src/presentations/index.ts')
  writeFileSync(
    registry,
    readFileSync(registry, 'utf8').replace(/\n\]/, `\n  { slug: '${SLUG}', title: 'Inspect fixture', load: () => import('./${SLUG}/Talk.tsx') },\n]`),
  )
  result = run('node', ['scripts/inspect-presentation.mjs', SLUG], root)
})

describe('INT-002 screenshot helper', () => {
  it('exits zero despite advisory warnings and reports them as non-evidence', () => {
    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain('[inspect] done')
    expect(result.output).toContain('not pass/fail evidence')
  })

  it('serves a production preview on the IPv4 loopback address', () => {
    expect(result.output).toMatch(/preview http:\/\/127\.0\.0\.1:\d+\//)
    expect(exists(root, 'dist/index.html')).toBe(true)
  })

  it('writes exactly one valid screenshot per step under a predictable path', () => {
    for (let n = 1; n <= 6; n++) {
      const file = path.join(root, 'inspection', SLUG, `step-0${n}.png`)
      expect(exists(file), file).toBe(true)
      expect(readFileSync(file).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    }
    expect(exists(root, 'inspection', SLUG, 'step-07.png')).toBe(false)
    expect(lines().filter((l) => l.includes('captured inspection/'))).toHaveLength(6)
  })

  it('captures at the standard 1440 x 900 desktop viewport', () => {
    const png = readFileSync(path.join(root, 'inspection', SLUG, 'step-01.png'))
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1440, 900])
  })

  it('captures only after each transition has settled, including the first step', async () => {
    // The probe animates red -> green over 600 ms after every step change; a capture
    // taken before the wait would show red or a blend instead of the final green.
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      for (let n = 1; n <= 6; n++) {
        const b64 = readFileSync(path.join(root, 'inspection', SLUG, `step-0${n}.png`)).toString('base64')
        await page.setContent(`<canvas id="c"></canvas>`)
        const pixel = (await page.evaluate(`(async () => {
          const img = new Image()
          img.src = 'data:image/png;base64,${b64}'
          await img.decode()
          const c = document.getElementById('c')
          c.width = img.width
          c.height = img.height
          const ctx = c.getContext('2d')
          ctx.drawImage(img, 0, 0)
          return [...ctx.getImageData(10, 10, 1, 1).data]
        })()`)) as number[]
        expect(pixel.slice(0, 3), `step ${n}`).toEqual([0, 255, 0])
      }
    } finally {
      await browser.close()
    }
  })

  it('reports an elapsed settle of at least the configured interval for every capture', () => {
    const waits = lines()
      .map((l) => /captured .* \(settled (\d+)ms\)/.exec(l)?.[1])
      .filter(Boolean)
      .map(Number)
    expect(waits).toHaveLength(6)
    for (const ms of waits) expect(ms).toBeGreaterThanOrEqual(800)
  })

  it('warns about the unmarked sibling collision on its own step only, naming both elements', () => {
    const w = warnings(2).filter((l) => l.includes('overlap'))
    expect(w).toHaveLength(1)
    expect(w[0]).toMatch(/alpha clean text/)
    expect(w[0]).toMatch(/beta collides with alpha/)
    for (const n of [1, 3, 4, 5]) expect(warnings(n).filter((l) => l.includes('overlap')), `step ${n}`).toEqual([])
  })

  it('warns about a nested child overprinting its parent\'s text', () => {
    const w = warnings(6).filter((l) => l.includes('overlap'))
    expect(w).toHaveLength(1)
    expect(w[0]).toMatch(/alpha clean text/)
    expect(w[0]).toMatch(/nested child overprint/)
  })

  it('does not warn about the explicitly allowed readable overlap', () => {
    expect(result.output).not.toMatch(/gamma intentionally|delta intentionally/)
  })

  it('warns about indistinct active progress on every step', () => {
    for (let n = 1; n <= 6; n++) {
      expect(warnings(n).some((l) => /active progress entry is indistinct/.test(l)), `step ${n}`).toBe(true)
    }
  })

  it('warns about an unstyled active ToC entry despite its different label width, and not about the styled one', () => {
    for (const n of [3, 4, 5, 6]) {
      expect(warnings(n).some((l) => /active table-of-contents entry is indistinct/.test(l)), `step ${n}`).toBe(true)
    }
    for (const n of [1, 2]) {
      expect(warnings(n).some((l) => l.includes('table-of-contents')), `step ${n}`).toBe(false)
    }
  })

  it('reports small and browser-default attribution on their own steps and points to the hook', () => {
    expect(warnings(4).some((l) => /9px, below 11px.*\[data-presentation-attribution\]/.test(l))).toBe(true)
    expect(warnings(5).some((l) => /browser-default link style.*\[data-presentation-attribution\]/.test(l))).toBe(true)
    for (const n of [1, 2, 3, 6]) expect(warnings(n).some((l) => l.includes('attribution')), `step ${n}`).toBe(false)
  })
})
