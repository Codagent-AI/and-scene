import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('..', import.meta.url))
const sampleSlug = 'how-to-make-a-presentation'
const titles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const captions = ['It starts with you, a topic, and mild overconfidence.', 'One question at a time: the topic, the look, then each beat of the story.', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', 'Same shapes, new beats. Every answer extends the story without redrawing it.', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', 'Before saying done, it builds and renders every step — and fixes what breaks.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', 'This presentation was built exactly this way. Thanks for watching.']

try {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  if (!pkg.scripts?.build) throw new Error('missing build script')
  const registry = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
  const sample = await readFile(join(root, 'src/presentations/how-to-make-a-presentation/steps/index.tsx'), 'utf8')
  assert(registry.includes(`slug: '${sampleSlug}'`), 'reference sample is not registered')
  titles.forEach((title, index) => assert(sample.indexOf(title) >= 0 && (index === 0 || sample.indexOf(title) > sample.indexOf(titles[index - 1])), `reference title ${index + 1} is missing or out of order`))
  captions.forEach((caption) => assert(sample.includes(caption), `reference caption is missing: ${caption}`))

  await run('npm', ['run', 'build'])
  const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', shell: process.platform === 'win32' })
  try {
    await waitForPreview(preview)
    const browser = await chromium.launch({ headless: true })
    try { await verifySample(browser, preview) } finally { await browser.close() }
  } finally {
    if (preview.pid && process.platform !== 'win32') { try { process.kill(-preview.pid, 'SIGTERM') } catch {} }
    preview.kill('SIGTERM')
  }
  console.log('VERIFY PASS: build and nine-step reference render passed')
} catch (error) {
  console.error(`VERIFY FAIL: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
}

function assert(condition, message) { if (!condition) throw new Error(message) }
function run(command, args) { return new Promise((resolve, reject) => { const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }); child.on('error', reject); child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))) }) }
async function waitForPreview(child) {
  const deadline = Date.now() + 15_000
  let output = ''
  let started = false
  child.stdout.on('data', (chunk) => { output += chunk.toString(); started ||= output.includes('127.0.0.1:4173') })
  child.stderr.on('data', (chunk) => { output += chunk.toString() })
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview exited before startup: ${output.trim()}`)
    if (started) {
      try { const response = await fetch('http://127.0.0.1:4173/'); await response.body?.cancel(); if (response.ok) return } catch {}
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`preview did not start: ${output.trim()}`)
}
async function verifySample(browser, preview) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  try {
    await page.goto(`http://127.0.0.1:4173/${sampleSlug}`, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation]').waitFor()
    const count = await page.locator('[data-presentation]').getAttribute('data-step-count')
    assert(Number(count) === 9, `reference sample reports ${count} steps, expected 9`)
    for (let index = 0; index < 9; index += 1) {
      assert(preview.exitCode === null, `preview exited during browser verification at step ${index + 1}`)
      await page.waitForTimeout(700)
      assert(errors.length === 0, `browser error at step ${index + 1}: ${errors.join('; ')}`)
      assert(await page.locator('[data-step-index="' + index + '"]').count() === 1, `step ${index + 1} did not render`)
      if (index < 8) {
        await page.keyboard.press('ArrowRight')
        try { await page.locator(`[data-step-index="${index + 1}"]`).waitFor({ state: 'visible', timeout: 2_500 }) } catch { throw new Error(`step transition failed at step ${index + 1} -> ${index + 2}`) }
      }
    }
    assert(errors.length === 0, `browser errors after final step: ${errors.join('; ')}`)
  } finally { await page.close() }
}
