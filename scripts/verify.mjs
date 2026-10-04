import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { startPreview, stopPreview } from './preview-server.mjs'

const slug = 'how-to-make-a-presentation'
const talk = new URL(`../src/presentations/${slug}/steps/index.tsx`, import.meta.url)
const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
const stepSource = await readFile(talk, 'utf8')
const expected = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]
function fail(message) { console.error(`FAIL: ${message}`); process.exit(1) }
if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`title: 'How to Use This Skill to Make a Presentation'`)) fail('reference sample is missing from the explicit presentation registry')
let position = -1
for (let index = 0; index < expected.length; index++) {
  const [title, caption] = expected[index]
  const titleAt = stepSource.indexOf(title, position + 1)
  const captionAt = stepSource.indexOf(caption, titleAt + title.length)
  if (titleAt < 0 || captionAt < 0) fail(`reference sample outline is missing or out of order at step ${index + 1}: ${title}`)
  position = captionAt
}
if ((stepSource.match(/id: `how-to-step-\$\{beat \+ 1\}`/g) ?? []).length !== 1 || !stepSource.includes("groupKey: 'how-to-evolving-scene'")) fail('reference sample does not use nine ordered steps in one persistent scene')
console.log('PASS: reference sample registration and nine-step outline')

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const build = spawn(npm, ['run', 'build'], { stdio: 'inherit' })
const buildCode = await new Promise((resolve) => build.once('exit', (code) => resolve(code ?? 1)))
if (buildCode !== 0) fail('build failed')
let preview
let browser
let currentStep = 1
try {
  preview = await startPreview()
  const { base } = preview
  let ready = false
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(base)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready || !base.startsWith('http://127.0.0.1:')) throw new Error('preview did not become ready on 127.0.0.1')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const footer = page.locator('[data-step-count]')
  await footer.waitFor()
  const count = Number(await footer.getAttribute('data-step-count'))
  if (count !== 9) throw new Error(`expected 9 steps, received ${count}`)
  await page.locator('[data-presentation-mode-toggle]').focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(100)
  if (await footer.getAttribute('data-step-index') !== '0') throw new Error('ArrowRight on a focused control advanced the presentation')
  await page.evaluate(() => document.activeElement?.blur())
  for (currentStep = 1; currentStep <= count; currentStep++) {
    await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, currentStep - 1, { timeout: 5_000 })
    await page.locator('[data-presentation-stage]').waitFor({ state: 'visible' })
    await page.waitForTimeout(850)
    if (errors.length) throw new Error(errors.join('; '))
    if (currentStep < count) await page.keyboard.press('ArrowRight')
  }
  console.log(`PASS: production browser rendered all ${count} steps on ${base}`)
} catch (error) {
  console.error(`FAIL: render /${slug} at step ${currentStep}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview) await stopPreview(preview.server)
}
