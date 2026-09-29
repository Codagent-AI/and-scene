import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import net from 'node:net'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const slug = 'how-to-make-a-presentation'
const base = new URL('../', import.meta.url)
const read = relative => readFile(new URL(relative, base), 'utf8')
let preview
let browser
let currentStep = 0
let phase = 'sample contract'

function start(command, args, options = {}) {
  const child = spawn(command, args, { cwd: new URL('../', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'], ...options })
  let output = ''
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  return { child, get output() { return output } }
}

function isVisiblyPainted(element) {
  let opacity = 1
  let current = element
  while (current) {
    const style = getComputedStyle(current)
    opacity *= Number.parseFloat(style.opacity || '1')
    if (style.display === 'none') return false
    current = current.parentElement
  }
  const visibility = getComputedStyle(element).visibility
  const rect = element.getBoundingClientRect()
  return opacity > 0.02 && visibility !== 'hidden' && visibility !== 'collapse' && rect.width > 1 && rect.height > 1
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close(error => error ? reject(error) : resolve(address.port))
    })
  })
}

try {
const expected = JSON.parse(await read(`src/presentations/${slug}/outline.json`))
  assert.equal(expected.length, 9, 'reference outline must contain nine steps')
  const registry = await read('src/presentations/index.ts')
  assert.match(registry, new RegExp(`slug: '${slug}'`), 'reference sample must be registered')
  const talk = await read(`src/presentations/${slug}/Talk.tsx`)
  assert.match(talk, /<Presentation\s+steps=\{STEPS\}/, 'reference route must render its steps')
  const stepSource = await read(`src/presentations/${slug}/steps/index.tsx`)
  assert.match(stepSource, /outline\.map/, 'reference step data must follow the canonical outline')
  assert.match(stepSource, /groupKey: 'how-to-evolving-scene'/, 'reference scene must persist as one group')
  assert.match(stepSource, /payload: \{ through: index \}/, 'all later beats must accumulate earlier scene entities')

  phase = 'build'
  const build = start('npm', ['run', 'build'])
  const buildCode = await new Promise((resolve, reject) => {
    build.child.once('error', reject)
    build.child.once('exit', resolve)
  })
  if (buildCode !== 0) throw new Error(`Build failed (${buildCode}):\n${build.output}`)

  phase = 'preview startup'
  const port = await freePort()
  const url = `http://${host}:${port}`
  preview = start('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { detached: true })
  let ready = false
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (preview.child.exitCode !== null) throw new Error(`Preview exited early (${preview.child.exitCode}):\n${preview.output}`)
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`Preview readiness check failed at ${url}:\n${preview.output}`)

  phase = 'browser render'
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  const sceneEntities = [
    ['howto-you', 'howto-prompt'],
    ['howto-you', 'howto-prompt', 'howto-conversation', 'howto-skill', 'howto-question'],
    ['howto-you', 'howto-prompt', 'howto-conversation', 'howto-skill', 'howto-question', 'howto-card-1'],
    ['howto-you', 'howto-prompt', 'howto-conversation', 'howto-skill', 'howto-question', 'howto-card-1', 'howto-card-2'],
    ['howto-you', 'howto-prompt', 'howto-conversation', 'howto-skill', 'howto-question', 'howto-card-1', 'howto-card-2', 'howto-card-3', 'howto-ghost'],
    ['howto-you', 'howto-prompt', 'howto-conversation', 'howto-skill', 'howto-question', 'howto-card-1', 'howto-card-2', 'howto-card-3', 'howto-card-4', 'howto-kit-connector', 'howto-kit'],
    ['howto-you', 'howto-prompt', 'howto-conversation', 'howto-skill', 'howto-question', 'howto-card-1', 'howto-card-2', 'howto-card-3', 'howto-card-4', 'howto-card-5', 'howto-kit-connector', 'howto-kit', 'howto-verify-connector', 'howto-verify'],
    ['howto-you', 'howto-prompt', 'howto-conversation', 'howto-skill', 'howto-question', 'howto-card-1', 'howto-card-2', 'howto-card-3', 'howto-card-4', 'howto-card-5', 'howto-kit-connector', 'howto-kit', 'howto-verify-connector', 'howto-verify', 'howto-modify'],
    ['howto-you', 'howto-prompt', 'howto-conversation', 'howto-skill', 'howto-question', 'howto-card-1', 'howto-card-2', 'howto-card-3', 'howto-card-4', 'howto-card-5', 'howto-kit-connector', 'howto-kit', 'howto-verify-connector', 'howto-verify', 'howto-modify', 'howto-reveal'],
  ]
  page.on('console', message => { if (message.type() === 'error') errors.push(`step ${currentStep + 1}: console.error: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`step ${currentStep + 1}: uncaught page error: ${error.message}`))
  await page.goto(`${url}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation][data-step-count]').first()
  await root.waitFor({ state: 'visible' })
  const total = Number(await root.getAttribute('data-step-count'))
  assert.equal(total, expected.length, `registered route rendered ${total} steps, expected ${expected.length}`)
  for (let index = 0; index < expected.length; index += 1) {
    currentStep = index
    phase = `browser render step ${index + 1}`
    await page.waitForTimeout(950)
    const actual = Number(await root.getAttribute('data-step-index'))
    assert.equal(actual, index, `transition failed at step ${index + 1}: observed index ${actual}`)
    await page.waitForFunction(() => document.querySelector('[data-presentation-footer]')?.getAttribute('data-ready') !== 'false')
    const title = await page.locator('.presentation-step-title').innerText()
    const caption = await page.locator('.presentation-caption').innerText()
    assert.equal(title, expected[index].title, `wrong title at step ${index + 1}`)
    assert.equal(caption, expected[index].caption, `wrong caption at step ${index + 1}`)
    const scene = page.locator('[data-presentation-scene]').first()
    assert.ok(await scene.evaluate(isVisiblyPainted), `scene is not visibly rendered at step ${index + 1}`)
    for (const entity of sceneEntities[index]) {
      const node = scene.locator(`[data-presentation-entity="${entity}"]`)
      assert.ok(await node.count() && await node.evaluate(isVisiblyPainted), `scene entity ${entity} is missing or invisible at step ${index + 1}`)
    }
    if (index < expected.length - 1) {
      phase = `browser render step ${index + 2}`
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(next => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === next, index + 1, { timeout: 5000 })
    }
  }
  if (errors.length) throw new Error(`Browser render failed: ${errors.join('\n')}`)
  console.log(`PASS: build, canonical sample contract, and production browser render (${slug}, ${expected.length} steps on ${host})`)
} catch (error) {
  console.error(`FAIL [${phase}]${phase.startsWith('browser render step') ? '' : currentStep ? ` near step ${currentStep + 1}` : ''}: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview?.child.pid) {
    try { process.kill(-preview.child.pid, 'SIGTERM') } catch {}
  }
}
