import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = Number(process.env.AND_SCENE_VERIFY_PORT ?? 4178)
const base = `http://${host}:${port}`
const slug = 'how-to-make-a-presentation'
const expectedTitles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const expectedCaptions = ['It starts with you, a topic, and mild overconfidence.', 'One question at a time: the topic, the look, then each beat of the story.', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', 'Same shapes, new beats. Every answer extends the story without redrawing it.', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', 'Before saying done, it builds and renders every step — and fixes what breaks.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', 'This presentation was built exactly this way. Thanks for watching.']
let server
let browser
function fail(message) { throw new Error(message) }
async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} failed (${code})`)))
  })
}
try {
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const steps = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/index.tsx', import.meta.url), 'utf8')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`import('./how-to-make-a-presentation/Talk')`)) fail('sample registry check failed: reference route is missing')
  let previous = -1
  for (const [i, value] of [...expectedTitles, ...expectedCaptions].entries()) {
    const at = steps.indexOf(value)
    if (at <= previous) fail(`sample outline check failed: canonical title/caption ${i + 1} is missing or out of order`)
    previous = at
  }
  if ((steps.match(/id: `how-to-step-/g) ?? []).length !== 1 || !steps.includes('groupKey: \'how-to-evolving-scene\'')) fail('sample outline check failed: nine grouped states are required')
  await run('npm', ['run', 'build'])
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  let ready = false
  for (let i = 0; i < 80; i++) { try { if ((await fetch(base)).ok) { ready = true; break } } catch {} await delay(250); if (server.exitCode !== null) fail('render check failed: vite preview exited before becoming ready') }
  if (!ready) fail('render check failed: preview did not become ready at 127.0.0.1')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  let activeIndex = 0
  const errors = []
  page.on('pageerror', error => errors.push({ step: activeIndex + 1, message: error.message }))
  page.on('console', message => { if (message.type() === 'error') errors.push({ step: activeIndex + 1, message: message.text() }) })
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor({ state: 'attached', timeout: 10000 }).catch(() => fail(errors.length ? `browser render failed: ${errors.map(error => `step ${error.step}: ${error.message}`).join('; ')}` : 'render check failed: registered reference route did not render'))
  const count = Number(await root.getAttribute('data-step-count'))
  if (count !== 9) fail(`render check failed: expected 9 steps, found ${count}`)
  for (activeIndex = 0; activeIndex < count; activeIndex++) {
    if (Number(await root.getAttribute('data-step-index')) !== activeIndex) {
      if (activeIndex > 0) await page.keyboard.press('ArrowRight')
      await page.waitForFunction(i => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === i, activeIndex, { timeout: 4000 }).catch(() => fail(`step ${activeIndex + 1} transition failed: data-step-index did not advance`))
    }
    await page.waitForTimeout(450)
    const stepErrors = errors.filter(error => error.step === activeIndex + 1)
    if (stepErrors.length) fail(`step ${activeIndex + 1} render failed: ${stepErrors.map(error => error.message).join('; ')}`)
  }
  if (errors.length) fail(`browser render failed: ${errors.map(error => `step ${error.step}: ${error.message}`).join('; ')}`)
  console.log('PASS: build, canonical sample outline, registered route, and all 9 production-rendered steps')
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)) }
}
