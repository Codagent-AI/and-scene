import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'
import { beats } from '../src/presentations/how-to-make-a-presentation/beats.mjs'
import { canonicalSteps, referenceSlug, validateReferenceContract } from './verification-contract.mjs'

const base = 'http://127.0.0.1:4173'
let previewServer
let browser
let activeStep = 'preflight'

try {
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  validateReferenceContract(registry, beats)
  console.log('PASS: canonical reference sample contract')

  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })
  const buildCode = await new Promise((resolve, reject) => {
    build.once('error', reject)
    build.once('exit', (code) => resolve(code ?? 1))
  })
  if (buildCode !== 0) throw new Error(`Build check failed with exit code ${buildCode}`)
  console.log('PASS: whole application build')

  previewServer = await startPreview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}/${referenceSlug}`, { waitUntil: 'networkidle' })
  const presentation = page.locator('[data-step-count]')
  await presentation.waitFor()
  const count = Number(await presentation.getAttribute('data-step-count'))
  if (count !== canonicalSteps.length) throw new Error(`Render check failed: expected ${canonicalSteps.length} steps, found ${count}`)
  for (let index = 0; index < count; index += 1) {
    activeStep = `step ${index + 1}`
    try {
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index, { timeout: 3000 })
    } catch {
      throw new Error(`Render transition failed at ${activeStep}: expected index ${index}`)
    }
    await page.waitForTimeout(800)
    const [visibleTitle, visibleCaption] = await page.locator('[data-presentation-narration]').evaluate((element) => [element.querySelector('h1')?.textContent?.trim(), element.querySelector('p')?.textContent?.trim()])
    const [, expectedTitle, expectedCaption] = canonicalSteps[index]
    if (visibleTitle !== expectedTitle || visibleCaption !== expectedCaption) throw new Error(`Content verification failed at ${activeStep}: expected "${expectedTitle}" with its canonical caption`)
    const observed = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
    if (observed !== index) throw new Error(`Render transition failed at ${activeStep}: expected index ${index}, observed ${observed}`)
    if (errors.length) throw new Error(`Browser render failed at ${activeStep}: ${errors.join('; ')}`)
    if (index + 1 < count) await page.keyboard.press('ArrowRight')
  }
  console.log(`PASS: production browser rendered all ${count} steps at ${base}/${referenceSlug}`)
  console.log('VERIFY PASS')
} catch (error) {
  console.error(`VERIFY FAILED during ${activeStep}: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  try {
    await browser?.close()
  } finally {
    if (previewServer) await new Promise((resolve, reject) => previewServer.httpServer.close((error) => error ? reject(error) : resolve()))
  }
}
