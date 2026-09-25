import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { run, startPreview, stopPreview } from './preview.mjs'

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const slug = 'how-to-make-a-presentation'
const title = 'How to Use This Skill to Make a Presentation'
const outline = [
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
let preview, browser
try {
  try { await run('npm', ['run', 'build'], project) } catch (error) { throw new Error(`build check failed: ${error.message}`) }
  const registry = await readFile(path.join(project, 'src/presentations/index.ts'), 'utf8')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`title: '${title}'`) || !registry.includes(`import('./${slug}/Talk')`)) throw new Error('sample check failed: canonical reference route is missing or not registered')
  preview = startPreview(project)
  const base = await preview.ready
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  let expectedIndex = 0
  const errors = []
  page.on('pageerror', error => errors.push({ index: expectedIndex, message: error.message }))
  page.on('console', message => { if (message.type() === 'error') errors.push({ index: expectedIndex, message: message.text() }) })
  const route = new URL(`/${slug}`, base).href
  await page.goto(route)
  const root = page.locator('[data-presentation]')
  try { await root.waitFor({ timeout: 10000 }) } catch { throw new Error(`render check failed at step 1: sample route ${route} did not mount`) }
  const count = Number(await root.getAttribute('data-step-count'))
  if (count !== outline.length) throw new Error(`sample check failed: expected ${outline.length} steps, found ${count}`)
  for (let index = 0; index < count; index++) {
    expectedIndex = index
    try {
      await page.waitForFunction(i => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === i, index, { timeout: 5000 })
      const actualTitle = await root.getAttribute('data-step-title')
      const actualCaption = await root.getAttribute('data-step-caption')
      if (actualTitle !== outline[index][0] || actualCaption !== outline[index][1]) throw new Error(`outline mismatch (title: ${JSON.stringify(actualTitle)}, caption: ${JSON.stringify(actualCaption)})`)
      await page.waitForTimeout(700)
      const stepErrors = errors.filter(error => error.index === index)
      if (stepErrors.length) throw new Error(stepErrors.map(error => error.message).join('; '))
      console.log(`PASS: step ${index + 1}/${count} — ${actualTitle}`)
      if (index + 1 < count) {
        expectedIndex = index + 1
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(i => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === i, index + 1, { timeout: 5000 })
      }
    } catch (error) { throw new Error(`render check failed at step ${expectedIndex + 1}: ${error.message}`) }
  }
  console.log(`PASS: build, canonical sample, and all ${count} rendered steps on 127.0.0.1`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview) await stopPreview(preview)
}
