import path from 'node:path'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM helper without type declarations
import { startPreview } from '../../scripts/lib/preview.mjs'
import { cleanup, copyTemplate, run, writeProjectFile } from './helpers.ts'

afterAll(cleanup)

// Browser fixture for scene persistence, layer isolation and cross-fade across a group change.
const TALK = `import { Presentation } from '../../presentation-kit/Presentation.tsx'
import { Box } from '../../presentation-kit/nodes/Box.tsx'
import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer.tsx'
import type { Step } from '../../presentation-kit/types.ts'

function SceneA({ stepIndex }: { payload: null; stepIndex: number }) {
  return (
    <>
      <SceneLayer>
        <Box id="shared" at={{ x: 100, y: 100, w: 120, h: 60 }}>shared</Box>
      </SceneLayer>
      {stepIndex >= 1 ? (
        <SceneLayer>
          <Box id="extra" at={{ x: 400, y: 100, w: 120, h: 60 }}>extra</Box>
        </SceneLayer>
      ) : null}
    </>
  )
}

function SceneB() {
  return (
    <SceneLayer>
      <Box id="shared" at={{ x: 100, y: 200, w: 120, h: 60 }}>shared</Box>
    </SceneLayer>
  )
}

const mk = (n: number, Scene: Step<null>['Scene'], groupKey: string): Step<null> =>
  ({ id: 's' + n, era: 'e', title: 'T' + n, caption: 'C' + n, Scene, payload: null, groupKey })

const steps = [mk(1, SceneA, 'a'), mk(2, SceneA, 'a'), mk(3, SceneB, 'b')]

export default function Talk() {
  return <Presentation steps={steps} title="Stage fixture" initialMode="browse" />
}
`

let origin = ''
let stop = () => {}

beforeAll(async () => {
  const project = copyTemplate()
  writeProjectFile(project, 'src/presentations/index.ts', `import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const PRESENTATIONS: readonly PresentationEntry[] = [
  { slug: 'stage', title: 'stage', load: () => import('./stage/Talk.tsx') },
]
`)
  writeProjectFile(project, 'src/presentations/stage/Talk.tsx', TALK)
  const build = run('npm', ['run', 'build'], project)
  expect(build.status, build.output).toBe(0)
  const preview = await startPreview(path.resolve(project))
  origin = preview.origin
  stop = preview.stop
})

afterAll(() => stop())

describe('stage in a real browser', () => {
  it('keeps one scene instance and every existing entity in place when a layer mounts; cross-fades on a group change', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
      await page.goto(`${origin}/stage`)
      await page.waitForSelector('[data-step-count]')
      await page.waitForTimeout(1200)
      const rect = (id: string) =>
        page.evaluate((i) => {
          const r = document.querySelector(`[data-presentation-id="${i}"]`)!.getBoundingClientRect()
          return [r.x, r.y, r.width, r.height].map(Math.round)
        }, id)
      await page.evaluate(() => {
        ;(document.querySelector('[data-presentation-scene]') as HTMLElement & { marker?: string }).marker = 'kept'
      })
      const before = await rect('shared')

      // Step 2 mounts a second layer inside the same group: nothing already on screen moves.
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(1500)
      expect(await rect('shared')).toEqual(before)
      expect(await page.locator('[data-presentation-layer]').count()).toBe(2)
      expect(await page.evaluate(() => (document.querySelector('[data-presentation-scene]') as HTMLElement & { marker?: string }).marker)).toBe('kept')

      // Step 3 changes the group: both scenes coexist while cross-fading, and the shared entity morphs.
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(120)
      const during = await page.evaluate(() => ({
        scenes: document.querySelectorAll('[data-presentation-scene]').length,
        opacities: [...document.querySelectorAll<HTMLElement>('[data-presentation-scene]')].map((s) => Number(getComputedStyle(s).opacity)),
      }))
      expect(during.scenes).toBe(2)
      expect(during.opacities.some((o) => o > 0 && o < 1)).toBe(true)
      await page.waitForTimeout(1500)
      expect(await page.locator('[data-presentation-scene]').count()).toBe(1)
      const after = await rect('shared')
      expect(after[1]).toBeGreaterThan(before[1])
    } finally {
      await browser.close()
    }
  })
})
