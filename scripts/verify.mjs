import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium, installSignalCleanup, rootPath, startPreview, stopPreview, waitForStep } from './preview-utils.mjs'
import { assertCanonicalSample, SAMPLE_SLUG, SAMPLE_ROUTE, SAMPLE_OUTLINE } from './sample-outline.mjs'

const phases = []
let preview
let browser
installSignalCleanup(() => ({ child: preview?.child, browser }))
const report = (name, ok, detail = '') => { phases.push({ name, ok, detail }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? `: ${detail}` : ''}`) }
const run = (command, args) => spawnSync(command, args, { cwd: rootPath, encoding: 'utf8' })
try {
  const build = run('npm', ['run', 'build'])
  if (build.status !== 0) throw Object.assign(new Error((build.stderr || build.stdout || 'build failed').trim()), { phase: 'build' })
  report('build', true, 'npm run build')
} catch (error) { report('build', false, error.message); finish(); process.exit(1) }

try {
  const registry = await readFile(fileURLToPath(new URL('../src/presentations/index.ts', import.meta.url)), 'utf8')
  const outline = await readFile(fileURLToPath(new URL('../src/presentations/how-to-make-a-presentation/steps/outline.ts', import.meta.url)), 'utf8')
  assertCanonicalSample(registry, outline)
  report('sample', true, 'registered nine-step outline is in order')
} catch (error) { report('sample', false, error.message); finish(); process.exit(1) }

let currentStep = 0
try {
  preview = await startPreview({ onUrl: url => console.log(`[INFO] preview host=${url} readiness=${url}`) })
  browser = await chromium()
  const page = await browser.newPage()
  const failures = []
  page.on('console', message => { if (message.type() === 'error') failures.push({ step: currentStep, message: message.text() }) })
  page.on('pageerror', error => failures.push({ step: currentStep, message: error.message }))
  const browserUrl = `${preview.url}${SAMPLE_ROUTE}`
  console.log(`[INFO] browser URL=${browserUrl}`)
  await page.goto(browserUrl, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
  if (count !== SAMPLE_OUTLINE.length) throw new Error(`expected 9 steps, found ${count}`)
  currentStep = 0
  let actual = Number(await page.locator('[data-step-index]').first().getAttribute('data-step-index'))
  if (actual !== 0) throw new Error(`step 0: expected index 0, found ${actual}`)
  async function checkOutline(step) {
    const [title, caption] = SAMPLE_OUTLINE[step]
    const renderedCaption = (await page.locator('[data-presentation-caption]').innerText()).trim()
    if (renderedCaption !== caption) throw new Error(`step ${step}: caption does not match the canonical outline`)
    await page.keyboard.press('p')
    await page.waitForFunction(() => document.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode') === 'present')
    const renderedTitle = (await page.locator('[data-presentation-title]').innerText()).trim()
    if (renderedTitle !== title) throw new Error(`step ${step}: title does not match the canonical outline`)
    await page.keyboard.press('p')
    await page.waitForFunction(() => document.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode') === 'browse')
  }
  await checkOutline(0)
  console.log('Observed step indices: 0')
  for (let step = 1; step < count; step++) {
    currentStep = step
    await page.keyboard.press('ArrowRight')
    try { await waitForStep(page, step) } catch { throw new Error(`step ${step}: transition did not advance to index ${step}`) }
    actual = Number(await page.locator('[data-step-index]').first().getAttribute('data-step-index'))
    if (actual !== step) throw new Error(`step ${step}: expected index ${step}, found ${actual}`)
    await checkOutline(step)
    await page.waitForTimeout(100)
    const failure = failures.find(item => item.step === step)
    if (failure) throw new Error(`step ${step}: ${failure.message}`)
    console.log(`Observed step indices: ${step}`)
  }
  if (failures.length) { const f = failures[0]; throw new Error(`step ${f.step}: ${f.message}`) }
  report('render', true, `${count} steps rendered cleanly; host, readiness probe, and browser URL use 127.0.0.1`)
} catch (error) { report('render', false, error.message) }
finally { await browser?.close(); await stopPreview(preview?.child) }
finish()

function finish() {
  const failed = phases.filter(item => !item.ok).map(item => item.name)
  console.log(failed.length ? `FAIL: ${failed.join(', ')}` : 'PASS: build, sample, render')
  process.exitCode = failed.length ? 1 : 0
}
