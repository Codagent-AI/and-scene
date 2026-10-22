// Persisting entities hold still, or move once, across a step change in a real browser.
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadPlaywright } from '../../scripts/lib/browse.mjs'
import { startPreview, teardown } from '../../scripts/lib/preview.mjs'
import { copyAppFiles, linkDependencies, repoRoot, run, tempDir } from '../helpers/process.mjs'

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const YOU = '[data-presentation-entity="how-to:you"]'
let work

beforeAll(() => {
  work = tempDir('morph-stability')
})
afterAll(() => fs.rmSync(work, { recursive: true, force: true }))

const edit = (app, rel, from, to) => {
  const file = path.join(app, rel)
  const before = fs.readFileSync(file, 'utf8')
  expect(before, `${rel} does not contain ${from}`).toContain(from)
  fs.writeFileSync(file, before.replace(from, to))
}

function builtCopy(name, fault = () => {}) {
  const app = path.join(work, name)
  copyAppFiles(repoRoot, app, {
    files: ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html'],
    dirs: ['src', 'scripts', 'public'],
  })
  linkDependencies(app)
  fault(app)
  const build = run('npm', ['run', 'build'], { cwd: app })
  expect(build.status, build.out).toBe(0)
  return app
}

/** Left edge (viewport px) of the "you" box on every frame while the deck advances one step. */
async function sampleAdvance(app, viewport) {
  const { chromium } = await loadPlaywright(repoRoot)
  const preview = await startPreview(app)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport })
    await page.goto(preview.url('/how-to-make-a-presentation'))
    await page.waitForSelector('[data-step-count]')
    await page.waitForTimeout(2500)
    await page.evaluate((selector) => {
      window.__xs = []
      const tick = () => {
        window.__xs.push(document.querySelector(selector).getBoundingClientRect().x)
        window.__raf = requestAnimationFrame(tick)
      }
      tick()
    }, YOU)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(2000)
    return await page.evaluate(() => {
      cancelAnimationFrame(window.__raf)
      return window.__xs
    })
  } finally {
    await teardown({ browser, preview })
  }
}

describe('persisting entities across a step change (production build, scaled canvas)', () => {
  // The canvas is scaled away from 1 at both viewports, which is what exposed the skewed morphs.
  it.each([
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ])('keeps an entity that does not move still at $width x $height', async (viewport) => {
    const xs = await sampleAdvance(builtCopy(`still-${viewport.width}`), viewport)
    expect(xs.length).toBeGreaterThan(30)
    for (const x of xs) expect(Math.abs(x - xs[0])).toBeLessThanOrEqual(1)
  })

  it('moves an entity that changes position once, with no second displacement', async () => {
    const app = builtCopy('moved', (copy) => {
      const scene = `${SAMPLE}/SampleScene.tsx`
      edit(copy, scene, 'function Entity({ def }: { def: EntityDef }) {', 'function Entity({ def, shift = 0 }: { def: EntityDef; shift?: number }) {')
      edit(copy, scene, '<Box id={def.id} x={def.x}', '<Box id={def.id} x={def.x + shift}')
      edit(copy, scene, '<Entity def={ENTITIES[id]} />', '<Entity def={ENTITIES[id]} shift={id === ID.you && payload.visible.length === 4 ? 150 : 0} />')
      edit(copy, scene, "import { ENTITIES } from './entities.ts'", "import { ENTITIES, ID } from './entities.ts'")
      // Dropping the prompt also exercises a departing entity beside the moving one.
      edit(copy, `${SAMPLE}/steps/02-the-skill-interviews-you.ts`, 'visible: [...STEP_01.payload.visible, ID.skill', 'visible: [...STEP_01.payload.visible.filter((id) => id !== ID.prompt), ID.skill')
    })
    const xs = await sampleAdvance(app, { width: 1440, height: 900 })
    const start = xs[0]
    const end = xs[xs.length - 1]
    expect(end - start).toBeGreaterThan(100)
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(start - 2)
      expect(x).toBeLessThanOrEqual(end + 2)
    }
    // Never travels back toward where it started once it is on its way.
    for (let i = 1; i < xs.length; i += 1) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1] - 2)
  })
})
