import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { afterAll, describe, expect, it } from 'vitest'
import { SKILL_CLI, cleanupTmp, materialize, run, write } from '../helpers'

afterAll(cleanupTmp)

const SCENE = `import { Box, SceneLayer, type SceneProps } from '../../../presentation-kit'
export interface Payload { n: number }
export function Scene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Box id="mover" x={payload.n === 1 ? 100 : 600} y={100} w={100} h={50}>m</Box>
    </SceneLayer>
  )
}
`

describe('persisting entities morph in place on the scaled canvas', () => {
  it('animates monotonically between the old and new positions without overshoot', async () => {
    const app = materialize()
    expect(run('node', [SKILL_CLI, 'create', app, 'mover', 'Mover'], app).status).toBe(0)
    write(app, 'src/presentations/mover/steps/Scene.tsx', SCENE)
    const lib = await import(pathToFileURL(path.join(app, 'scripts/lib.mjs')).href)
    expect(lib.runBuild().status).toBe(0)
    const preview = await lib.startPreview()
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      await page.goto(`${preview.base}/mover`)
      await page.waitForSelector('[data-presentation-root]')
      await page.waitForTimeout(1200)
      const xs: number[] = await page.evaluate(async () => {
        const canvas = document.querySelector('[data-presentation-canvas]')!.getBoundingClientRect()
        const left = () => document.querySelector('[data-presentation-id="mover"]')!.getBoundingClientRect().left - canvas.left
        const samples = [left()]
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => requestAnimationFrame(r))
          samples.push(left())
        }
        return samples
      })
      const scale = Number(await page.getAttribute('[data-presentation-canvas]', 'data-presentation-scale'))
      expect(scale).toBeGreaterThan(1)
      const [start, end] = [100 * scale, 600 * scale]
      expect(xs[0]).toBeCloseTo(start, 0)
      expect(xs[xs.length - 1]).toBeCloseTo(end, 0)
      for (let i = 1; i < xs.length; i++) {
        expect(xs[i]).toBeGreaterThanOrEqual(start - 2)
        expect(xs[i]).toBeLessThanOrEqual(end + 2)
        expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1] - 2)
      }
    } finally {
      await browser.close()
      preview.stop()
    }
  })
})
