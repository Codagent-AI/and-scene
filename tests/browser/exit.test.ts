import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { afterAll, describe, expect, it } from 'vitest'
import { copyProject, removeProject, run } from './helpers'

const copies: string[] = []
afterAll(() => copies.forEach(removeProject))

const TALK = `import { Box, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<{ show: boolean }>) {
  return (
    <SceneLayer>
      {payload.show && <Box id="exit-probe-node" style={{ position: 'absolute', left: 100, top: 100, width: 220, height: 80 }}>Temporary entity</Box>}
    </SceneLayer>
  )
}
const steps: Step<{ show: boolean }>[] = [
  { id: 'present', era: 'Probe', title: 'Entity is here', caption: 'The entity begins visible.', Scene, payload: { show: true }, groupKey: 'same' },
  { id: 'gone', era: 'Probe', title: 'Entity leaves', caption: 'The entity should animate out.', Scene, payload: { show: false }, groupKey: 'same' },
]
export default function Talk() {
  return <Presentation steps={steps} title="Exit probe" />
}
`

describe('E2E-003: departing entities animate out in the production build', () => {
  it('keeps a removed entity mounted mid-transition, then removes it', async () => {
    const dir = copyProject()
    copies.push(dir)
    mkdirSync(path.join(dir, 'src/presentations/exit-probe'), { recursive: true })
    writeFileSync(path.join(dir, 'src/presentations/exit-probe/Talk.tsx'), TALK)
    const registry = path.join(dir, 'src/presentations/index.ts')
    writeFileSync(
      registry,
      readFileSync(registry, 'utf8').replace(
        /\n\]\n?$/,
        "\n  { slug: 'exit-probe', title: 'Exit probe', load: () => import('./exit-probe/Talk') },\n]\n",
      ),
    )
    const build = await run('npm', ['run', 'build'], dir)
    expect(build.code, build.output).toBe(0)

    const { startPreview } = await import(pathToFileURL(path.join(dir, 'scripts/preview-lib.mjs')).href)
    const preview = await startPreview(dir, Error)
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
      await page.goto(`${preview.origin}/exit-probe`)
      const node = page.locator('[data-presentation-id="exit-probe-node"]')
      await node.waitFor()
      await page.keyboard.press('ArrowRight')
      await expect.poll(() => page.locator('[data-presentation-root]').getAttribute('data-step-index')).toBe('1')
      await page.waitForTimeout(40)
      expect(await node.count(), 'entity vanished without an exit animation').toBe(1)
      await node.waitFor({ state: 'detached', timeout: 3000 })
    } finally {
      await browser.close()
      preview.stop()
    }
  })
})
