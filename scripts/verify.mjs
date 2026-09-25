import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const host = '127.0.0.1'
const port = Number(process.env.PORT || 4173)
const origin = `http://${host}:${port}`
const route = '/how-to-make-a-presentation'
const expected = [
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
let preview
let browser
let activeStep = 0
function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited with code ${code}`)))
  })
}
function startPreview() {
  const child = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let announced = false
  let output = ''
  let rejectFailure
  const failed = new Promise((_, reject) => { rejectFailure = reject })
  const ready = new Promise((resolveReady, rejectReady) => {
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      process.stdout.write(text)
      output += text.replace(/\u001b\[[0-9;]*m/g, '')
      if (output.includes(`${origin}/`)) { announced = true; resolveReady() }
    })
    child.stderr.on('data', (chunk) => process.stderr.write(chunk))
    child.once('error', (error) => { rejectReady(error); rejectFailure(error) })
    child.once('exit', (code, signal) => {
      const error = new Error(`vite preview exited ${announced ? 'unexpectedly' : 'before readiness'} (code ${code ?? 'none'}, signal ${signal ?? 'none'})`)
      rejectFailure(error)
      if (!announced) rejectReady(error)
    })
  })
  return {
    child,
    ready: Promise.race([ready, failed]),
    failed,
    assertAlive() { if (child.exitCode !== null) throw new Error(`vite preview exited unexpectedly with code ${child.exitCode}`) },
  }
}
try {
  console.log('VERIFY: checking registered reference sample')
  const registry = await readFile(resolve(root, 'src/presentations/index.ts'), 'utf8')
  const sample = await readFile(resolve(root, 'src/presentations/how-to-make-a-presentation/steps/index.tsx'), 'utf8')
  if (!registry.includes("slug: 'how-to-make-a-presentation'") || !registry.includes('how-to-make-a-presentation/Talk')) throw new Error('sample is missing from presentation registry')
  let last = -1
  for (const [era, title, caption] of expected) {
    const position = sample.indexOf(title)
    if (position < 0 || position <= last || !sample.includes(`'${era}'`) || !sample.includes(`'${caption}'`)) throw new Error(`sample outline is missing or out of order at: ${title}`)
    last = position
  }
  console.log('VERIFY: building whole application')
  await run('npm', ['run', 'build'])
  const startup = startPreview()
  preview = startup.child
  await startup.ready
  startup.assertAlive()
  await Promise.race([verifyBrowser(startup), startup.failed])

} catch (error) {
  console.error(`VERIFY FAILED: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview && preview.exitCode === null) {
    preview.kill('SIGTERM')
    await Promise.race([new Promise((resolveExit) => preview.once('exit', resolveExit)), delay(3000)])
    if (preview.exitCode === null) preview.kill('SIGKILL')
  }
}

async function verifyBrowser(startup) {
    const readiness = await fetch(origin)
    if (!readiness.ok) throw new Error(`preview readiness probe failed at ${origin}: HTTP ${readiness.status}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${activeStep}: console ${message.text()}`) })
    page.on('pageerror', (error) => errors.push(`step ${activeStep}: uncaught ${error.message}`))
    await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' })
    const rootNode = page.locator('[data-presentation-root]')
    await rootNode.waitFor({ state: 'visible' })
    const count = Number(await rootNode.getAttribute('data-step-count'))
    if (count !== expected.length) throw new Error(`sample must expose ${expected.length} steps; found ${count}`)
    for (activeStep = 0; activeStep < count; activeStep++) {
      if (activeStep > 0) {
        await page.keyboard.press('ArrowRight')
        try { await page.waitForFunction((wanted) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === wanted, activeStep, { timeout: 3000 }) }
        catch { throw new Error(`step ${activeStep} transition failed; expected data-step-index=${activeStep}`) }
      }
      await page.waitForTimeout(800)
      const actual = Number(await rootNode.getAttribute('data-step-index'))
      if (actual !== activeStep) throw new Error(`step ${activeStep} rendered with index ${actual}`)
      if (errors.length) throw new Error(errors[0])
    }
    if (errors.length) throw new Error(errors[0])
    console.log(`PASS: built app and rendered all ${count} reference steps at ${origin}${route}`)
}
