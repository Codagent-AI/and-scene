import assert from 'node:assert/strict'
import { readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { chromium } from 'playwright'
import { isolatedProject } from './helpers/isolated-project.mjs'

const slug = 'inspection-fixture'

// One presentation, five steps: a clean baseline plus one defect variant per step.
const fixtureTsx = `import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import './style.css'

interface Variant { kind: 'clean' | 'collision' | 'allowed' | 'chrome' | 'attribution' }
function Scene({ payload, step }: SceneProps<Variant>) {
  const overlap = <><p className="probe-a" data-presentation-caption="">Overlapping text A</p><p className="probe-b" data-presentation-caption="">Overlapping text B</p></>
  return <div className="fixture-scene">
    <div className="settle-probe" key={step.id} />
    {payload.kind === 'collision' && overlap}
    {payload.kind === 'allowed' && <div data-presentation-allow-overlap="">{overlap}</div>}
  </div>
}
const kinds: Variant['kind'][] = ['clean', 'collision', 'allowed', 'chrome', 'attribution']
const eras = ['one', 'one', 'two', 'two', 'three']
const steps: Step<Variant>[] = kinds.map((kind, i) => ({ id: 'fixture-' + kind, era: eras[i], title: 'Fixture ' + kind, caption: 'Caption for ' + kind, groupKey: 'fixture', Scene, payload: { kind } }))
export default function Fixture() { return <Presentation steps={steps} title="Inspection fixture" initialMode="browse" /> }
`
const fixtureCss = `body { margin: 0; background: #101418; color: #eef2ee; font-family: system-ui, sans-serif; }
.presentation-header, .presentation-footer { color: #eef2ee; }
.presentation button { color: #cfd6cf; background: #222a30; border: 1px solid #222a30; }
.presentation-progress button { width: 12px; height: 12px; padding: 0; border-radius: 6px; }
.presentation-toc button, .presentation-navigation > button, .presentation-mode-tools button { padding: .35rem .7rem; }
.presentation [data-presentation-active="true"] { color: #101418; background: #d4ee92; border-color: #d4ee92; font-weight: 700; }
.presentation-attribution { color: #9aa99d; font-size: 14px; text-decoration: none; }
.fixture-scene { position: absolute; inset: 0; }
.settle-probe { position: absolute; inset: 0; animation: settle 400ms linear forwards; }
@keyframes settle { from { background: #ff0000; } to { background: #00ff00; } }
.fixture-scene p { position: absolute; left: 300px; margin: 0; padding: 4px; color: #101418; }
.probe-a { top: 150px; }
.probe-b { top: 158px; }
[data-step-index="3"] [data-presentation-active] { color: #cfd6cf; background: #222a30; border-color: #222a30; font-weight: 400; opacity: 1; }
[data-step-index="4"] .presentation-attribution { font-size: 8px; }
`
const registry = `import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType<Record<string, never>> }> }
export const presentations: PresentationEntry[] = [{ slug: '${slug}', title: 'Inspection fixture', load: () => import('./${slug}/Fixture') }]
`

async function fixtureProject() {
  const copy = await isolatedProject('and-scene-inspect-')
  const { project } = copy
  await rm(path.join(project, 'src/presentations/how-to-make-a-presentation'), { recursive: true })
  await mkdir(path.join(project, 'src/presentations', slug))
  await writeFile(path.join(project, 'src/presentations/index.ts'), registry)
  await writeFile(path.join(project, `src/presentations/${slug}/Fixture.tsx`), fixtureTsx)
  await writeFile(path.join(project, `src/presentations/${slug}/style.css`), fixtureCss)
  return copy
}

// Reads one pixel from each PNG using a single browser session.
async function pixelsAt(pngs, x, y) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    return await page.evaluate(async ({ images, x, y }) => Promise.all(images.map(async (data) => {
      const image = new Image()
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = `data:image/png;base64,${data}` })
      const canvas = document.createElement('canvas')
      canvas.width = image.width; canvas.height = image.height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      return [...context.getImageData(x, y, 1, 1).data]
    })), { images: pngs.map((png) => png.toString('base64')), x, y })
  } finally { await browser.close() }
}

const stepNumbers = [1, 2, 3, 4, 5]
const stepFile = (n) => `step-0${n}.png`
// A point inside the stage of the helper's 1440x1000 viewport, covered by the fixture's settle probe.
const probePoint = { x: 720, y: 520 }

test('screenshot helper captures settled steps and emits step-specific advisory warnings', { timeout: 240_000 }, async () => {
  const { temporary, project } = await fixtureProject()
  try {
    const build = spawnSync('npm', ['run', 'build'], { cwd: project, encoding: 'utf8', timeout: 120_000 })
    assert.equal(build.status, 0, build.stdout + build.stderr)
    const run = spawnSync(process.execPath, ['scripts/inspect-presentation.mjs', slug], { cwd: project, encoding: 'utf8', timeout: 90_000, env: { ...process.env, PRESENTATION_INSPECT_PORT: '4291', PRESENTATION_SETTLE_MS: '800' } })
    const output = run.stdout + run.stderr
    assert.equal(run.status, 0, output)
    assert.match(output, /Captured 5 settled steps/)

    // One predictable screenshot per step.
    const directory = path.join(project, 'artifacts/presentation-inspection', slug)
    assert.deepEqual((await readdir(directory)).sort(), stepNumbers.map(stepFile))

    // Captures happen after the 400ms probe animation finishes: the probe is fully green, never mid-fade red.
    const pngs = await Promise.all(stepNumbers.map((n) => readFile(path.join(directory, stepFile(n)))))
    const pixels = await pixelsAt(pngs, probePoint.x, probePoint.y)
    stepNumbers.forEach((n, i) => {
      assert.deepEqual([...pngs[i].subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], `step ${n} is not a PNG`)
      assert.deepEqual(pixels[i].slice(0, 3), [0, 255, 0], `step ${n} captured before the transition settled`)
    })

    // Warnings are step-specific; the clean baseline and the marked overlap stay quiet.
    const warnings = output.split('\n').filter((line) => line.startsWith('WARN '))
    const forStep = (n) => warnings.filter((line) => line.startsWith(`WARN step ${n}:`))
    assert.deepEqual(forStep(1), [], 'clean baseline should not warn')
    assert.equal(forStep(2).length, 1)
    assert.match(forStep(2)[0], /text\/chrome overlap: \[data-presentation-caption\] "Overlapping text A" overlaps \[data-presentation-caption\] "Overlapping text B"/)
    assert.deepEqual(forStep(3), [], 'explicitly allowed overlap must not warn')
    assert.deepEqual(forStep(4).map((line) => line.replace(/^WARN step 4: /, '')).sort(), ['active progress styling is indistinct', 'active table-of-contents styling is indistinct'])
    assert.equal(forStep(5).length, 1)
    assert.match(forStep(5)[0], /attribution is missing, browser-default, or undersized; style \[data-presentation-attribution\]/)
  } finally { await rm(temporary, { recursive: true, force: true }) }
})
