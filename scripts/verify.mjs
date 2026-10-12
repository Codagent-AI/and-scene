import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import process from 'node:process'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
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
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const tail = value => value.split('\n').slice(-18).join('\n')
const fail = (phase, message) => { console.error(`[verify] FAIL phase=${phase} ${message}`); process.exitCode = 1 }

async function freePort() {
  const server = createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}

async function browserInstance() {
  const options = {}
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROME_PATH
  if (executablePath) options.executablePath = executablePath
  try { return await chromium.launch({ headless: true, ...options }) }
  catch (error) {
    throw new Error(`Could not launch Chromium. Install it with "npx playwright install chromium" or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH/CHROME_PATH. ${error.message}`, { cause: error })
  }
}

async function main() {
  let server
  let browser
  const children = new Set()
  const stop = () => {
    for (const child of children) if (child.pid) try { process.kill(-child.pid, 'SIGTERM') } catch { /* already exited */ }
    if (browser) void browser.close().catch(() => {})
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  try {
    console.log('[verify] build: running npm run build')
    const build = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    children.add(build)
    let output = ''
    build.stdout.on('data', chunk => { output += chunk })
    build.stderr.on('data', chunk => { output += chunk })
    const buildCode = await new Promise(resolve => build.on('close', resolve))
    children.delete(build)
    if (buildCode !== 0) return fail('build', `npm run build exited ${buildCode}\n${tail(output)}`)
    console.log('[verify] build: passed')

    console.log('[verify] sample: checking canonical registration and step order')
    const registry = await fs.readFile(path.join(root, 'src/presentations/index.ts'), 'utf8').catch(() => '')
    const steps = await fs.readFile(path.join(root, 'src/presentations/how-to-make-a-presentation/steps.ts'), 'utf8').catch(() => '')
    if (!/slug\s*:\s*["']how-to-make-a-presentation["']/.test(registry) || !(await fs.stat(path.join(root, 'src/presentations/how-to-make-a-presentation')).catch(() => false))) return fail('sample', 'reference sample is missing or not registered: how-to-make-a-presentation')
    const rows = [...steps.matchAll(/\[\s*"[^"]*"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g)]
    if (rows.length !== expected.length) return fail('sample', `found ${rows.length} complete step rows; expected ${expected.length}`)
    for (let index = 0; index < expected.length; index += 1) {
      const [title, caption] = expected[index]
      const actualTitle = rows[index][1]
      const actualCaption = rows[index][2]
      if (actualTitle !== title || actualCaption !== caption) return fail('sample', `step ${index + 1} is missing or out of order: expected "${title}"`)
    }
    console.log('[verify] sample: canonical sample has 9 ordered steps')

    console.log('[verify] render: starting production preview at 127.0.0.1')
    const port = await freePort()
    server = spawn('npm', ['exec', '--', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, detached: true, stdio: ['ignore', 'ignore', 'pipe'] })
    children.add(server)
    let serverErrors = ''
    server.stderr.on('data', chunk => { serverErrors += chunk })
    const url = `http://127.0.0.1:${port}/`
    let ready = false
    for (let i = 0; i < 100; i += 1) {
      if (server.exitCode !== null) break
      try { const response = await fetch(url); if (response.ok) { ready = true; break } } catch { /* preview is not listening yet */ }
      await sleep(100)
    }
    if (!ready) return fail('render', `preview did not become ready at ${url}. ${serverErrors}`)
    console.log(`[verify] render: preview ready at ${url}`)
    browser = await browserInstance()
    const page = await browser.newPage()
    let errors = []
    let currentStep = 1
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${url}how-to-make-a-presentation`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-step-count]').first()
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (count !== 9) return fail('render', `step 1 reports ${count} steps; expected 9`)
    if (errors.length) return fail('render', `step 1: ${errors.join('; ')}`)
    console.log(`[verify] render: 127.0.0.1 route reports ${count} steps`)
    for (let index = 1; index < count; index += 1) {
      errors = []
      currentStep = index + 1
      await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction(expectedIndex => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expectedIndex, currentStep - 1, { timeout: 5000 }) }
      catch { return fail('render', `step ${currentStep}: data-step-index did not advance`) }
      if (errors.length) return fail('render', `step ${currentStep}: ${errors.join('; ')}`)
      console.log(`[verify] render: observed step ${currentStep}/9`)
    }
    if (errors.length) return fail('render', `step ${currentStep}: ${errors.join('; ')}`)
    console.log('[verify] render: all 9/9 steps rendered without browser errors')
    console.log('[verify] PASS')
  } catch (error) {
    fail('render', error.stack || error.message)
  } finally {
    if (browser) await browser.close().catch(() => {})
    if (server?.pid) { try { process.kill(-server.pid, 'SIGTERM') } catch { /* already exited */ } }
    for (const child of children) if (child.pid) try { process.kill(-child.pid, 'SIGTERM') } catch { /* already exited */ }
  }
}

await main()
/* global document */
