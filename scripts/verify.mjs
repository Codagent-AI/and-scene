import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { PREVIEW_URL, run, startPreview } from './preview.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const sampleSlug = 'how-to-make-a-presentation'
const titles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const captions = ['It starts with you, a topic, and mild overconfidence.', 'One question at a time: the topic, the look, then each beat of the story.', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', 'Same shapes, new beats. Every answer extends the story without redrawing it.', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', 'Before saying done, it builds and renders every step — and fixes what breaks.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', 'This presentation was built exactly this way. Thanks for watching.']

try {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  if (!pkg.scripts?.build) throw new Error('missing build script')
  const registry = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
  const sample = await readFile(join(root, 'src/presentations/how-to-make-a-presentation/steps/index.tsx'), 'utf8')
  assert(registry.includes(`slug: '${sampleSlug}'`), 'reference sample is not registered')
  titles.forEach((title, index) => assert(sample.indexOf(title) >= 0 && (index === 0 || sample.indexOf(title) > sample.indexOf(titles[index - 1])), `reference title ${index + 1} is missing or out of order`))
  captions.forEach((caption) => assert(sample.includes(caption), `reference caption is missing: ${caption}`))

  await run('npm', ['run', 'build'], root)
  const preview = await startPreview(root)
  try {
    const browser = await chromium.launch({ headless: true })
    try {
      await Promise.race([verifySample(browser, preview), preview.failure])
      assertPreviewAlive(preview, 'after browser verification')
    } finally { await browser.close() }
  } finally {
    await preview.stop()
  }
  console.log('VERIFY PASS: build and nine-step reference render passed')
} catch (error) {
  console.error(`VERIFY FAIL: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
}

function assert(condition, message) { if (!condition) throw new Error(message) }
function assertPreviewAlive(preview, phase) {
  assert(preview.alive(), `preview exited ${phase}`)
}
async function verifySample(browser, preview) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  try {
    await page.goto(new URL(sampleSlug, PREVIEW_URL).href, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation]').waitFor()
    const count = await page.locator('[data-presentation]').getAttribute('data-step-count')
    assert(Number(count) === 9, `reference sample reports ${count} steps, expected 9`)
    for (let index = 0; index < 9; index += 1) {
      assert(preview.alive(), `preview exited during browser verification at step ${index + 1}`)
      await page.waitForTimeout(700)
      assert(errors.length === 0, `browser error at step ${index + 1}: ${errors.join('; ')}`)
      assert(await page.locator('[data-step-index="' + index + '"]').count() === 1, `step ${index + 1} did not render`)
      if (index < 8) {
        await page.keyboard.press('ArrowRight')
        try { await page.locator(`[data-step-index="${index + 1}"]`).waitFor({ state: 'visible', timeout: 2_500 }) } catch { throw new Error(`step transition failed at step ${index + 1} -> ${index + 2}`) }
      }
    }
    assert(errors.length === 0, `browser errors after final step: ${errors.join('; ')}`)
    assertPreviewAlive(preview, 'after final step')
  } finally { await page.close() }
}
