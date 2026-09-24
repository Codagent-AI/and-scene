import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = 'how-to-make-a-presentation'
const port = Number(process.env.AND_SCENE_VERIFY_PORT ?? 4178)
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
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`process exited ${code}`)))
  })
}
let preview, browser
let activeStep = 'build'
try {
  await run('npm', ['run', 'build'])
  const registry = await (await import('node:fs/promises')).readFile('src/presentations/index.ts', 'utf8')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`./${slug}/Talk`)) throw new Error('reference sample is missing from the presentation registry')
  const source = await (await import('node:fs/promises')).readFile(`src/presentations/${slug}/steps/index.tsx`, 'utf8')
  for (const [index, [title, caption]] of expected.entries()) {
    if (!source.includes(title) || !source.includes(caption)) throw new Error(`canonical sample outline is missing title or caption at step ${index + 1}`)
  }
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (preview.exitCode !== null) throw new Error('vite preview exited before becoming ready')
    try { ready = (await fetch(`http://127.0.0.1:${port}/`)).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`vite preview did not become ready at 127.0.0.1:${port}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.setDefaultTimeout(Number(process.env.AND_SCENE_VERIFY_ACTION_TIMEOUT_MS ?? 10000))
  page.setDefaultNavigationTimeout(30000)
  let browserErrors = []
  page.on('pageerror', error => browserErrors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()) })
  activeStep = 'route'
  await page.goto(`http://127.0.0.1:${port}/${slug}`, { waitUntil: 'networkidle' })
  const hook = page.locator('[data-step-count]').first()
  await hook.waitFor({ state: 'attached', timeout: 10000 })
  const count = Number(await hook.getAttribute('data-step-count'))
  if (count !== expected.length) throw new Error(`reference sample must have ${expected.length} steps; found ${count}`)
  if (await page.locator('[data-presentation-mode="present"]').count()) await page.getByRole('button', { name: 'Switch to browse mode' }).click()
  for (let index = 0; index < count; index++) {
    activeStep = `step ${index + 1}`
    const actualIndex = Number(await hook.getAttribute('data-step-index'))
    if (actualIndex !== index) throw new Error(`expected active index ${index}, found ${actualIndex}`)
    const title = (await page.locator('.presentation-narration h2').textContent())?.trim()
    const caption = (await page.locator('.presentation-narration p').textContent())?.trim()
    if (title !== expected[index][0] || caption !== expected[index][1]) throw new Error(`canonical content mismatch: ${JSON.stringify({ title, caption })}`)
    await page.waitForTimeout(850)
    if (browserErrors.length) throw new Error(browserErrors.join('; '))
    if (index < count - 1) {
      await page.getByRole('button', { name: 'Next step' }).click()
      await page.waitForFunction(expectedIndex => Number(document.querySelector('[data-step-count]')?.getAttribute('data-step-index')) === expectedIndex, index + 1, { timeout: Number(process.env.AND_SCENE_VERIFY_TRANSITION_TIMEOUT_MS ?? 10000) })
    }
  }
  console.log(`PASS: production render verified ${count} canonical steps at http://127.0.0.1:${port}/${slug}`)
} catch (error) {
  console.error(`FAIL: ${activeStep}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview?.kill('SIGTERM')
}
