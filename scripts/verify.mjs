import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const referenceSlug = 'how-to-make-a-presentation'
const slug = process.argv[2] ?? referenceSlug
const host = '127.0.0.1'
const expectedReferenceSteps = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

function getAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Could not allocate an IPv4 preview port.'))
        return
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port))
    })
  })
}

function watchPreview(preview) {
  let failure
  const recordFailure = (error) => { failure = error instanceof Error ? error : new Error(String(error)) }
  preview.once('error', recordFailure)
  preview.once('exit', (code, signal) => recordFailure(new Error(`Preview exited before readiness (${code ?? signal ?? 'unknown'}).`)))
  return () => failure
}

async function waitForPreview(url, getPreviewFailure) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const failure = getPreviewFailure()
    if (failure) throw failure
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // The preview process is still starting.
    }
    await delay(250)
  }
  throw getPreviewFailure() ?? new Error(`Preview did not become ready at ${url}`)
}

function checkReferenceStep(index, count, era, title, caption) {
  if (count !== expectedReferenceSteps.length) throw new Error(`Reference sample must expose nine steps; found ${count}.`)
  const expected = expectedReferenceSteps[index]
  if (!expected || era !== expected[0] || title !== expected[1] || caption !== expected[2]) {
    throw new Error(`Reference sample outline differs at step ${index + 1}.`)
  }
}

let preview
let browser
let markerPath
try {
  await run('npm', ['run', 'build'])
  const port = await getAvailablePort()
  const marker = randomUUID()
  markerPath = resolve('dist', '.and-scene-verify-marker')
  await writeFile(markerPath, marker)
  preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  const getPreviewFailure = watchPreview(preview)
  const previewUrl = `http://${host}:${port}`
  await waitForPreview(`${previewUrl}/.and-scene-verify-marker`, getPreviewFailure)
  const markerResponse = await fetch(`${previewUrl}/.and-scene-verify-marker`)
  if (await markerResponse.text() !== marker) throw new Error('Preview did not serve this verification run\'s build marker.')

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto(`${previewUrl}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor({ timeout: 5_000 })
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('Presentation did not expose a valid data-step-count.')

  for (let index = 0; index < count; index += 1) {
    const stepNumber = index + 1
    if (await root.getAttribute('data-step-index') !== String(index)) throw new Error(`Step ${stepNumber} did not become active.`)
    if (errors.length) throw new Error(`Step ${stepNumber} failed: ${errors.join('; ')}`)
    if (slug === referenceSlug) {
      const era = await page.locator('[data-presentation-marker]').textContent()
      const title = await page.locator('[data-presentation-header] [data-presentation-title]').textContent()
      const caption = await page.locator('[data-presentation-caption]').textContent()
      checkReferenceStep(index, count, era, title, caption)
    }
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((nextIndex) => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(nextIndex), index + 1, { timeout: 3_000 })
    }
  }
  if (errors.length) throw new Error(`Step ${count} failed: ${errors.join('; ')}`)
  console.log(`VERIFY PASS: ${slug} rendered ${count} steps on ${host}.`)
} catch (error) {
  console.error(`VERIFY FAIL: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview) {
    preview.kill('SIGTERM')
    await once(preview, 'exit').catch(() => undefined)
  }
  if (markerPath) await rm(markerPath, { force: true })
}
