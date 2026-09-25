import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { preview } from 'vite'
import { ensureChromiumInstalled } from './chromium.mjs'
import { isValidStepCount, referenceSteps, validateReferenceOutline } from './reference-contract.mjs'

const slug = process.argv[2]
const referenceSlug = 'how-to-make-a-presentation'
if (!slug) {
  console.error('Usage: node scripts/verify.mjs <presentation-slug>')
  process.exit(1)
}
let server
let browser
let phase = 'preflight'
const fail = (message) => { throw new Error(`${phase}: ${message}`) }
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)))
})
try {
  phase = 'sample contract'
  if (slug === referenceSlug) {
    const source = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/index.tsx', import.meta.url), 'utf8')
    const issues = validateReferenceOutline(source)
    if (issues.length) fail(issues.join('; '))
  }
  phase = 'build'
  await run('npm', ['run', 'build'])

  phase = 'preview startup'
  server = await preview({ preview: { host: '127.0.0.1', port: 0 } })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') fail('preview server did not expose a TCP address')
  const baseUrl = `http://127.0.0.1:${address.port}`

  phase = 'browser render'
  await ensureChromiumInstalled()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  let currentStep = 0
  page.on('pageerror', (error) => errors.push(`step ${currentStep + 1}: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${currentStep + 1}: ${message.text()}`) })
  const response = await page.goto(`${baseUrl}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  if (!response?.ok()) fail(`sample route returned ${response?.status() ?? 'no response'}`)
  const root = page.locator('[data-presentation]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (!isValidStepCount(count)) fail('presentation exposes an invalid step count')
  if (slug === referenceSlug && count !== referenceSteps.length) fail(`expected ${referenceSteps.length} steps, found ${count}`)
  for (currentStep = 0; currentStep < count; currentStep++) {
    if (currentStep > 0) await page.keyboard.press('ArrowRight')
    try {
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, currentStep, { timeout: 5000 })
    } catch { fail(`step ${currentStep + 1} did not render or advance`) }
    await page.waitForTimeout(850)
    if (errors.length) fail(errors.join('; '))
  }
  phase = 'complete'
  console.log(`PASS: build succeeded; ${slug} rendered all ${count} steps on 127.0.0.1 without browser errors.`)
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error)
  console.error(detail.startsWith(`${phase}:`) ? `FAIL: ${detail}` : `FAIL: ${phase}: ${detail}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server) {
    server.httpServer.closeAllConnections()
    await new Promise((resolve) => server.httpServer.close(resolve))
  }
}
