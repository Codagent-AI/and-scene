import { readFile } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const expected = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['You’re looking at one', 'This presentation was built exactly this way. Thanks for watching.'],
]
const samplePath = 'src/presentations/how-to-make-a-presentation/steps.tsx'
const port = Number(process.env.PORT ?? 4179)
const base = `http://127.0.0.1:${port}`
const route = '/how-to-make-a-presentation'
let preview
let browser
let stepContext = 'preflight'

function fail(message) { throw new Error(message) }
try {
  const [stepsSource, registry] = await Promise.all([
    readFile(samplePath, 'utf8').catch(() => fail(`sample check failed: missing ${samplePath}`)),
    readFile('src/presentations/index.ts', 'utf8'),
  ])
  if (!registry.includes("slug: 'how-to-make-a-presentation'") || !registry.includes("import('./how-to-make-a-presentation/Talk')")) fail('sample check failed: reference presentation is not registered and reachable')
  const entries = [...stepsSource.matchAll(/title: '([^']*)', caption: '([^']*)'/g)].map(match => [match[1], match[2]])
  if (entries.length !== expected.length || expected.some(([title, caption], index) => entries[index]?.[0] !== title || entries[index]?.[1] !== caption)) fail(`sample check failed: expected canonical nine titles and captions in order, found ${entries.length} step(s)`)
  console.log('Sample check passed: registered canonical nine-step outline.')

  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
  if (build.status !== 0) fail(`build check failed: npm run build exited ${build.status ?? build.signal ?? 'without a status'}`)
  console.log('Build check passed.')

  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try { const response = await fetch(base); if (response.ok) { ready = true; break } } catch {}
    if (preview.exitCode !== null) fail(`preview check failed: vite preview exited ${preview.exitCode}`)
    await delay(250)
  }
  if (!ready) fail(`preview check failed: ${base} did not become ready`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  let errors = []
  page.on('pageerror', error => errors.push(`uncaught page error: ${error.message}`))
  page.on('console', message => { if (message.type() === 'error') errors.push(`console error: ${message.text()}`) })
  stepContext = `step 1 (${expected[0][0]})`
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (count !== expected.length) fail(`render check failed at step 0: expected ${expected.length} steps, got ${count || 'no data-step-count hook'}`)
  for (let index = 0; index < count; index++) {
    stepContext = `step ${index + 1} (${expected[index][0]})`
    const actual = Number(await root.getAttribute('data-step-index'))
    if (actual !== index) fail(`render check failed at ${stepContext}: expected data-step-index=${index}, got ${actual}`)
    if (await page.locator('[data-presentation-scene]').count() !== 1) fail(`render check failed at ${stepContext}: scene did not render`)
    if (await page.locator('[data-presentation-step-title]').innerText() !== expected[index][0]) fail(`render check failed at ${stepContext}: active title does not match outline`)
    if (errors.length) fail(`render check failed at ${stepContext}: ${errors.join('; ')}`)
    if (index < count - 1) {
      stepContext = `step ${index + 2} (${expected[index + 1][0]})`
      await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction(expectedIndex => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expectedIndex, index + 1, { timeout: 3000 }) }
      catch { fail(`render check failed at ${stepContext}: ArrowRight did not advance data-step-index to ${index + 1}`) }
    }
  }
  console.log(`Render check passed: ${count} steps rendered cleanly at ${base}${route}.`)
  console.log('Verification passed: build, registered sample outline, and production browser render.')
} catch (error) {
  console.error(`Verification failed at ${stepContext}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview && preview.exitCode === null) { preview.kill('SIGTERM'); await Promise.race([new Promise(resolve => preview.once('exit', resolve)), delay(2000)]) }
}
