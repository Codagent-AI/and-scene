import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const slug = 'how-to-make-a-presentation'
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const expectedSteps = [
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
    const child = spawn(command, args, { stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`build failed: ${command} ${args.join(' ')} exited ${code}`)))
  })
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => child.once('close', resolve))
}

async function terminatePreview(preview) {
  if (!preview?.pid) return
  if (process.platform === 'win32') {
    const taskkill = spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
    await new Promise((resolve) => taskkill.once('close', resolve))
  } else {
    try { process.kill(-preview.pid, 'SIGTERM') } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'ESRCH') throw error
    }
  }
  await waitForExit(preview)
}

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is still starting */ }
    await delay(100)
  }
  throw new Error(`preview failed: did not become ready at ${url}`)
}

async function assertStep(page, index) {
  const chrome = page.locator(`[data-step-index="${index}"]`)
  try {
    await chrome.waitFor({ state: 'attached', timeout: 2_000 })
  } catch {
    throw new Error(`transition failed at step ${index + 1}`)
  }
  await delay(80)
  if (Number(await chrome.getAttribute('data-step-index')) !== index) throw new Error(`transition failed at step ${index + 1}`)
  const [expectedTitle, expectedCaption] = expectedSteps[index]
  const titles = await page.locator('[data-presentation-progress-item]').evaluateAll((items) => items.map((item) => item.getAttribute('aria-label')))
  if (titles[index] !== expectedTitle) throw new Error(`sample outline failed at step ${index + 1}: expected title "${expectedTitle}"`)
  const caption = await page.locator('[data-presentation-caption]').textContent()
  if (caption?.trim() !== expectedCaption) throw new Error(`sample outline failed at step ${index + 1}: expected canonical caption`)
}

let preview
let browser
let activeStep = 0
try {
  await run(npmCommand, ['run', 'build'])
  preview = spawn(npmCommand, ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { detached: process.platform !== 'win32', stdio: 'ignore' })
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
