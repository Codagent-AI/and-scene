import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const route = '/how-to-make-a-presentation'
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

function fail(message) { throw new Error(`VERIFY FAIL: ${message}`) }

try {
  console.log('verify: npm run build')
  try { execFileSync('npm', ['run', 'build'], { stdio: 'inherit' }) } catch { fail('build phase failed') }
  const registry = readFileSync('src/presentations/index.ts', 'utf8')
  if (!registry.includes("how-to-make-a-presentation")) fail('reference sample is not registered')
  const sample = readFileSync('src/presentations/how-to-make-a-presentation/steps/index.ts', 'utf8')
  if (!sample.includes('step9')) fail('reference sample does not contain nine ordered steps')

  const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let previewOutput = ''
  preview.stdout.on('data', (chunk) => { previewOutput += chunk })
  preview.stderr.on('data', (chunk) => { previewOutput += chunk })
  const stopPreview = () => {
    if (preview.exitCode !== null) return
    try { process.kill(-preview.pid, 'SIGTERM') } catch { preview.kill('SIGTERM') }
  }
  process.on('exit', stopPreview)
  try {
    const deadline = Date.now() + 15_000
    while (Date.now() < deadline) {
      if (preview.exitCode !== null) fail(`preview exited early: ${previewOutput}`)
      if (previewOutput.includes(`127.0.0.1:${port}`)) {
        try { await fetch(`http://${host}:${port}${route}`); break } catch { /* wait for the server socket */ }
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (Date.now() >= deadline) fail(`preview did not become ready on ${host}:${port}`)
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      const errors = []
      page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
      await page.goto(`http://${host}:${port}${route}`, { waitUntil: 'networkidle' })
      const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
      if (count !== expected.length) fail(`sample declares ${count} steps, expected ${expected.length}`)
      for (let index = 0; index < expected.length; index += 1) {
        await page.waitForTimeout(700)
        const actualIndex = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
        if (actualIndex !== index) fail(`step ${index}: expected active index ${index}, got ${actualIndex}`)
        const title = await page.locator('[data-presentation-title]').first().textContent()
        const caption = await page.locator('[data-presentation-caption]').textContent()
        if (title !== expected[index][0] || caption !== expected[index][1]) fail(`step ${index}: canonical title or caption mismatch`)
        if (errors.length) fail(`step ${index}: ${errors.join('; ')}`)
        if (index < expected.length - 1) {
          await page.keyboard.press('ArrowRight')
          await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, index + 1)
        }
      }
    } finally { await browser.close() }
  } finally { stopPreview(); process.removeListener('exit', stopPreview) }
  console.log(`PASS: verified ${expected.length} steps at http://${host}:${port}${route}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
