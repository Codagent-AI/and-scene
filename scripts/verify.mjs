import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { npmCommand, run, startPreview, terminatePreview, waitForPreview } from './browser-runtime.mjs'

const host = '127.0.0.1'
const port = 4173
const slug = 'how-to-make-a-presentation'
const expectedSteps = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

async function assertStep(page, index) {
  const chrome = page.locator(`[data-step-index="${index}"]`)
  try {
    await chrome.waitFor({ state: 'attached', timeout: 2_000 })
  } catch {
    throw new Error(`transition failed at step ${index + 1}`)
  }
  await delay(80)
  if (Number(await chrome.getAttribute('data-step-index')) !== index) throw new Error(`transition failed at step ${index + 1}`)
  const [expectedEra, expectedTitle, expectedCaption] = expectedSteps[index]
  const marker = await page.locator('[data-presentation-marker]').textContent()
  const expectedMarker = `${String(index + 1).padStart(2, '0')} · ${expectedEra}`
  if (marker?.trim() !== expectedMarker) throw new Error(`sample outline failed at step ${index + 1}: expected canonical era "${expectedEra}"`)
  const titles = await page.locator('[data-presentation-progress-item]').evaluateAll((items) => items.map((item) => item.getAttribute('aria-label')))
  if (titles[index] !== expectedTitle) throw new Error(`sample outline failed at step ${index + 1}: expected title "${expectedTitle}"`)
  const caption = await page.locator('[data-presentation-caption]').textContent()
  if (caption?.trim() !== expectedCaption) throw new Error(`sample outline failed at step ${index + 1}: expected canonical caption`)
}

let preview
let browser
let activeStep = 0
try {
  try {
    await run(npmCommand, ['run', 'build'])
  } catch (error) {
    throw new Error(`build failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  const previewHandle = startPreview(host, port)
  preview = previewHandle.child
  await previewHandle.started
  const url = `http://${host}:${port}/${slug}`
  await waitForPreview(url)
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console at step ${activeStep + 1}: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`page error at step ${activeStep + 1}: ${error.message}`))
  await page.goto(url, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-step-count][data-step-index]')
  try {
    await chrome.waitFor({ state: 'attached', timeout: 2_000 })
  } catch {
    throw new Error(`sample outline failed: ${slug} is not reachable as a presentation route`)
  }
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (count !== expectedSteps.length) throw new Error(`sample outline failed: expected ${expectedSteps.length} steps, found ${count}`)
  for (activeStep = 0; activeStep < count; activeStep += 1) {
    await assertStep(page, activeStep)
    if (errors.length) throw new Error(errors.join('; '))
    if (activeStep < count - 1) await page.keyboard.press('ArrowRight')
  }
  if (errors.length) throw new Error(errors.join('; '))
  console.log(`PASS: ${slug} rendered ${count} canonical steps on ${host}`)
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await terminatePreview(preview)
}
