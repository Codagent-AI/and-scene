import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = 'how-to-make-a-presentation'
const title = 'How to Use This Skill to Make a Presentation'
const outline = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', 'You’re looking at one', 'This presentation was built exactly this way. Thanks for watching.'],
]

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} failed (${code})`)))
})

let server
let browser
let activeStep = 0
try {
  try { await run('npm', ['run', 'build']) }
  catch (error) { throw new Error(`Build verification failed: ${error.message}`) }
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const route = new RegExp(`slug:\\s*['"]${slug}['"][\\s\\S]*?title:\\s*['"]${title}['"][\\s\\S]*?import\\(['"]\\./${slug}/Talk['"]\\)`)
  if (!route.test(registry)) throw new Error(`Sample registration check failed: ${slug} is missing or malformed`)
  const sample = await readFile(new URL(`../src/presentations/${slug}/steps/index.tsx`, import.meta.url), 'utf8')
  let previous = -1
  for (const [era, stepTitle, caption] of outline) {
    const at = sample.indexOf(`['${era}', '${stepTitle}', '${caption}']`)
    if (at <= previous) throw new Error(`Sample outline check failed: missing or out-of-order step “${stepTitle}”`)
    previous = at
  }

  const previewUrl = 'http://127.0.0.1:4173'
  let serverExit
  let serverError
  let serverOutput = ''
  let serverStderr = ''
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  server.stdout.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk })
  server.stderr.setEncoding('utf8').on('data', (chunk) => { serverStderr += chunk })
  server.once('error', (error) => { serverError = error })
  server.once('exit', (code, signal) => { serverExit = { code, signal } })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (serverError) throw new Error(`Render verification failed: could not start preview: ${serverError.message}`)
    if (serverExit) throw new Error(`Render verification failed: preview server exited early (port in use?): ${JSON.stringify(serverExit)}${serverStderr ? `; ${serverStderr.trim()}` : ''}`)
    // Vite's own ready line proves this child bound the port; a successful fetch
    // alone could belong to an unrelated server already listening there.
    const plainServerOutput = serverOutput.replace(/\u001b\[[0-9;]*m/g, '')
    if (plainServerOutput.includes(`${previewUrl}/`)) {
      try { if ((await fetch(`${previewUrl}/`)).ok) { ready = true; break } } catch {}
    }
    await delay(250)
  }
  if (!ready) throw new Error(`Render verification failed: preview did not become ready on 127.0.0.1:4173${serverStderr ? `; ${serverStderr.trim()}` : ''}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  if (serverExit || serverError) throw new Error(`Render verification failed: preview server stopped before browser navigation${serverStderr ? `; ${serverStderr.trim()}` : ''}`)
  const response = await page.goto(`${previewUrl}/${slug}`)
  if (!response?.ok()) throw new Error(`Render verification failed: /${slug} returned ${response?.status()}`)
  const footer = page.locator('[data-step-count]')
  try { await footer.waitFor({ timeout: 5000 }) }
  catch { throw new Error(`Render verification failed at step 1: sample chrome did not render`) }
  const count = Number(await footer.getAttribute('data-step-count'))
  if (count !== outline.length) throw new Error(`Render verification failed at step 1: expected ${outline.length} steps, found ${count}`)
  for (activeStep = 0; activeStep < count; activeStep++) {
    if (serverExit || serverError) throw new Error(`Render verification failed at step ${activeStep + 1}: preview server stopped${serverStderr ? `; ${serverStderr.trim()}` : ''}`)
    await page.waitForTimeout(650)
    const actual = Number(await footer.getAttribute('data-step-index'))
    if (actual !== activeStep) throw new Error(`Render verification failed at step ${activeStep + 1}: observed index ${actual}`)
    const observedTitle = (await page.locator('.presentation-caption strong').textContent())?.trim()
    const observedCaption = (await page.locator('.presentation-caption p').textContent())?.trim()
    if (observedTitle !== outline[activeStep][1] || observedCaption !== outline[activeStep][2]) throw new Error(`Render verification failed at step ${activeStep + 1}: title or caption does not match the canonical outline`)
    if (errors.length) throw new Error(`Browser error at step ${activeStep + 1}: ${errors.splice(0).join('; ')}`)
    if (activeStep < count - 1) {
      await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, activeStep + 1, { timeout: 3000 }) }
      catch { throw new Error(`Render verification failed at step ${activeStep + 2}: ArrowRight did not advance the step index`) }
    }
  }
  if (errors.length) throw new Error(`Browser error at step ${activeStep}: ${errors.join('; ')}`)
  console.log(`PASS: built app and rendered all ${count} canonical steps at /${slug} on 127.0.0.1`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once('exit', resolve))
    server.kill('SIGTERM')
    await Promise.race([exited, delay(2000)])
    if (server.exitCode === null) server.kill('SIGKILL')
  }
}
