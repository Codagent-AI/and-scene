import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.on('error', reject)
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
})
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1 }
const reference = process.argv.includes('--reference')
let server
let browser
try {
  await run('npm', ['run', 'build'])
  const registry = await (await import('node:fs/promises')).readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const entries = [...registry.matchAll(/slug:\s*'([^']+)'\s*,\s*title:\s*'([^']+)'/g)].map((match) => ({ slug: match[1], title: match[2] }))
  const titles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
  let entry
  if (reference) {
    entry = entries.find((candidate) => candidate.slug === 'how-to-make-a-presentation' && candidate.title === 'How to Use This Skill to Make a Presentation')
    if (!entry) throw new Error('canonical sample is missing or not registered')
    const source = await (await import('node:fs/promises')).readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/index.ts', import.meta.url), 'utf8')
    const captions = ['It starts with you, a topic, and mild overconfidence.', 'One question at a time: the topic, the look, then each beat of the story.', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', 'Same shapes, new beats. Every answer extends the story without redrawing it.', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', 'Before saying done, it builds and renders every step — and fixes what breaks.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', 'This presentation was built exactly this way. Thanks for watching.']
    if (!source.includes('export const STEPS')) throw new Error('canonical sample step data is missing')
    let previous = -1
    for (let index = 0; index < titles.length; index++) {
      const titleAt = source.indexOf(titles[index])
      const captionAt = source.indexOf(captions[index])
      if (titleAt < 0 || captionAt < 0 || titleAt <= previous || captionAt <= titleAt) throw new Error(`canonical sample title or caption ${index + 1} is missing or out of order`)
      previous = captionAt
    }
  } else {
    entry = entries[0]
    if (!entry) throw new Error('no presentations are registered yet')
  }
  if (await fetch('http://127.0.0.1:4173/', { signal: AbortSignal.timeout(1000) }).then(() => true, () => false)) throw new Error('127.0.0.1:4173 is already serving; stop the stale preview and retry')
  server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  let serverError
  let serverOutput = ''
  server.on('error', (error) => { serverError = error })
  server.stdout.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk })
  server.stderr.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk })
  const url = `http://127.0.0.1:4173/${entry.slug}`
  let ready = false
  for (let i = 0; i < 60; i++) {
    if (serverError) throw new Error(`preview server failed to start: ${serverError.message}`)
    if (server.exitCode !== null) throw new Error(`preview server exited early with code ${server.exitCode}: ${serverOutput.trim()}`)
    if (await fetch('http://127.0.0.1:4173/', { signal: AbortSignal.timeout(1000) }).then((response) => response.ok, () => false)) {
      await delay(50)
      if (server.exitCode !== null) throw new Error(`preview server exited during readiness probe with code ${server.exitCode}: ${serverOutput.trim()}`)
      ready = true
      break
    }
    await delay(250)
  }
  if (serverError) throw new Error(`preview server failed to start: ${serverError.message}`)
  if (server.exitCode !== null) throw new Error(`preview server exited early with code ${server.exitCode}: ${serverOutput.trim()}`)
  if (!ready) throw new Error('preview did not become ready at 127.0.0.1:4173')
  if (!(await fetch(url)).ok) throw new Error(`preview did not serve ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  let activeStep = 0
  page.on('console', (message) => { if (message.type() === 'error') fail(`console error at step ${activeStep + 1}: ${message.text()}`) })
  page.on('pageerror', (error) => fail(`page error at step ${activeStep + 1}: ${error.message}`))
  await page.goto(url, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation-root]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (!count || (reference && count !== 9)) throw new Error(reference ? `expected 9 sample steps, got ${count}` : 'registered presentation has no steps')
  for (let index = 0; index < count; index++) {
    activeStep = index
    const actual = Number(await root.getAttribute('data-step-index'))
    if (actual !== index) throw new Error(`step ${index + 1} did not render; index is ${actual}`)
    const title = await page.locator('.footer-copy h1').innerText()
    if (reference && title !== titles[index]) throw new Error(`step ${index + 1} title mismatch: ${title}`)
    if (index < count - 1) {
      activeStep = index + 1
      await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction((i) => Number(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')) === i, index + 1) }
      catch { throw new Error(`step ${index + 2} transition did not advance the public step index`) }
    }
  }
  if (process.exitCode) throw new Error('browser emitted errors')
  console.log(reference ? 'PASS: build, registered nine-step sample, and production browser render' : `PASS: build and production browser render for ${entry.slug} (${count} steps)`)
} catch (error) { fail(error instanceof Error ? error.message : String(error)) }
finally { if (browser) await browser.close(); if (server) await new Promise((resolve) => { if (server.exitCode !== null) return resolve(); server.once('exit', resolve); server.kill('SIGTERM') }) }
