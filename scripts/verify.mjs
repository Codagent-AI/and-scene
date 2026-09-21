import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const slug = 'how-to-make-a-presentation'
const expectedTitles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const expectedCaptions = ['It starts with you, a topic, and mild overconfidence.', 'One question at a time: the topic, the look, then each beat of the story.', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', 'Same shapes, new beats. Every answer extends the story without redrawing it.', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', 'Before saying done, it builds and renders every step — and fixes what breaks.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', 'This presentation was built exactly this way. Thanks for watching.']
let preview

try {
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' })
  const registry = readFileSync('src/presentations/index.ts', 'utf8')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes('How to Use This Skill to Make a Presentation')) throw new Error('reference sample is missing from the presentation registry')
  preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  await waitForPreview(`http://${host}:${port}/`)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`console error: ${message.text()}`) })
    page.on('pageerror', (error) => errors.push(`page error: ${error.message}`))
    await page.goto(`http://${host}:${port}/${slug}`, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation-scene]').waitFor({ state: 'visible' })
    const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
    if (count !== 9) throw new Error(`reference sample must expose 9 steps, got ${count}`)
    for (let index = 0; index < count; index += 1) {
      if (index > 0) await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(850)
      const actual = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-index'))
      if (actual !== index) throw new Error(`step ${index + 1}: transition stopped at index ${actual}`)
      const title = await page.locator('[data-presentation-present-title], [data-presentation-title]').first().textContent()
      if (!title?.includes(expectedTitles[index])) throw new Error(`step ${index + 1}: expected title ${expectedTitles[index]}, got ${title}`)
      if (await page.locator('[data-presentation-caption]').textContent() !== expectedCaptions[index]) throw new Error(`step ${index + 1}: canonical caption mismatch`)
      if (errors.length) throw new Error(`step ${index + 1}: ${errors.join('; ')}`)
    }
    console.log(`PASS: verified ${count} reference steps on http://${host}:${port}/${slug}`)
  } finally { await browser.close() }
} catch (error) {
  console.error(`FAIL: verification — ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  preview?.kill('SIGTERM')
}

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`preview did not become ready at ${url}`)
}
