// @vitest-environment node
// A persisting entity morphs in place inside the fit-scaled canvas: every frame of the layout
// animation stays between its old and new positions, whatever the canvas scale is.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startPreview } from '../lib.mjs'
import { makeCopy, run } from './copy'

const TRAVEL = 600
/** A slow linear morph keeps frame sampling meaningful even when the machine is loaded. */
const MORPH_S = 3

let app: string
let preview: { origin: string; stop: () => void }
let browser: Browser

beforeAll(async () => {
  app = makeCopy('and-scene-morph')
  const folder = join(app, 'src/presentations/fx-morph')
  mkdirSync(folder, { recursive: true })
  writeFileSync(
    join(folder, 'Talk.tsx'),
    `import { Box, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<number>) {
  return <SceneLayer><Box id="mover" transition={{ layout: { duration: ${MORPH_S}, ease: 'linear' } }} style={{ position: 'absolute', left: payload, top: 100, width: 100, height: 100 }} /></SceneLayer>
}
const steps: Step<number>[] = [0, ${TRAVEL}].map((x, i) => ({ id: 's' + i, era: 'e', title: 'T' + i, caption: 'C' + i, groupKey: 'g', Scene, payload: x }))
export default function Talk() {
  return <Presentation steps={steps} title="Morph" initialMode="present" />
}
`,
  )
  writeFileSync(
    join(app, 'src/presentations/index.ts'),
    `import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly PresentationEntry[] = [
  { slug: 'fx-morph', title: 'fx-morph', load: () => import('./fx-morph/Talk') },
]
`,
  )
  rmSync(join(app, 'scripts/reference-sample.json'))
  const build = run('npm', ['run', 'build'], app, 240_000)
  expect(build.status, build.output).toBe(0)
  preview = await startPreview(app)
  browser = await chromium.launch()
}, 300_000)

afterAll(async () => {
  await browser?.close()
  preview?.stop()
  if (app) rmSync(app, { recursive: true, force: true })
})

describe('layout morph under fit scaling', () => {
  for (const viewport of [
    { width: 1760, height: 900 },
    { width: 700, height: 500 },
  ]) {
    it(`stays between the old and new positions at ${viewport.width}x${viewport.height}`, async () => {
      const page = await browser.newPage({ viewport })
      try {
        await page.goto(`${preview.origin}/fx-morph`)
        await page.waitForSelector('[data-presentation-entity="mover"]')
        // Let any first-paint layout settling finish before the measured morph.
        await page.waitForTimeout(MORPH_S * 1000 + 800)
        const scale = Number(await page.getAttribute('[data-presentation-stage]', 'data-presentation-scale'))
        expect(Math.abs(scale - 1)).toBeGreaterThan(0.2)

        const { start, end, frames } = await page.evaluate(async (ms) => {
          const x = () => document.querySelector('[data-presentation-entity="mover"]')!.getBoundingClientRect().x
          const start = x()
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
          const frames: number[] = []
          const until = performance.now() + ms
          while (performance.now() < until) {
            await new Promise((r) => requestAnimationFrame(r))
            frames.push(x())
          }
          return { start, end: x(), frames }
        }, MORPH_S * 1000 + 800)

        expect(end - start).toBeCloseTo(TRAVEL * scale, 0)
        // The morph departs from where the entity was, not from a scale-distorted offset.
        expect(Math.min(...frames) - start).toBeLessThan((end - start) * 0.15)
        for (const f of frames) {
          expect(f).toBeGreaterThanOrEqual(start - 1)
          expect(f).toBeLessThanOrEqual(end + 1)
        }
      } finally {
        await page.close()
      }
    }, 60_000)
  }
})
