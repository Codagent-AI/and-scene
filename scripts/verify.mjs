import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { preview } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const slug = 'how-to-make-a-presentation'
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
let server
let browser
let failedStep = 0
try {
  const build = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
  const buildCode = await new Promise((resolve, reject) => { build.once('error', reject); build.once('exit', resolve) })
  if (buildCode !== 0) throw new Error(`BUILD failed (exit ${buildCode})`)

  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const talk = await readFile(new URL('../src/presentations/how-to-make-a-presentation/Talk.tsx', import.meta.url), 'utf8')
  if (!registry.includes(`slug: '${slug}'`)) throw new Error(`SAMPLE failed: /${slug} is missing from the presentation registry`)
  let cursor = -1
  for (let index = 0; index < expected.length; index++) {
    for (const text of expected[index]) {
      const found = talk.indexOf(text, cursor + 1)
      if (found < 0) throw new Error(`SAMPLE failed: step ${index + 1} is missing or out of order: ${text}`)
      cursor = found
    }
  }
  console.log(`PASS: canonical ${expected.length}-step sample is registered and ordered`)

  server = await preview({ root, preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const baseUrl = server.resolvedUrls?.local?.[0]
  if (!baseUrl || !baseUrl.startsWith('http://127.0.0.1:')) throw new Error('PREVIEW failed: server did not bind to IPv4 loopback')
  let ready = false
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(baseUrl)).ok) { ready = true; break } } catch { /* readiness probe */ }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (!ready) throw new Error(`PREVIEW failed: readiness probe timed out at ${baseUrl}`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  let runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()) })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  const route = new URL(`${slug}/`, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  if (route.hostname !== '127.0.0.1') throw new Error(`PREVIEW failed: browser route must use 127.0.0.1, got ${route.href}`)
  await page.goto(route.href, { waitUntil: 'networkidle' })
  const rootHook = page.locator('[data-step-count][data-step-index]')
  try { await rootHook.waitFor({ state: 'visible', timeout: 10000 }) }
  catch { throw new Error(`RENDER failed at step 1: route did not expose presentation hooks${runtimeErrors.length ? `; browser errors: ${runtimeErrors.join('; ')}` : ''}`) }
  const total = Number(await rootHook.getAttribute('data-step-count'))
  if (total !== expected.length) throw new Error(`SAMPLE failed: expected ${expected.length} steps, found ${total}`)
  for (let index = 0; index < total; index++) {
    failedStep = index + 1
    if (runtimeErrors.length) throw new Error(`RENDER failed at step ${failedStep}: ${runtimeErrors.join('; ')}`)
    const actual = Number(await rootHook.getAttribute('data-step-index'))
    if (actual !== index) throw new Error(`TRANSITION failed at step ${failedStep}: expected index ${index}, found ${actual}`)
    if (index < total - 1) {
      await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, index + 1, { timeout: 5000 }) }
      catch { throw new Error(`TRANSITION failed after step ${failedStep}: next step index did not advance`) }
      await page.waitForTimeout(700)
    }
  }
  if (runtimeErrors.length) throw new Error(`RENDER failed at step ${failedStep}: ${runtimeErrors.join('; ')}`)
  console.log(`PASS: production preview rendered all ${total} steps without browser errors (${baseUrl})`)
  console.log('PASS: npm run verify')
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await server?.close()
}
