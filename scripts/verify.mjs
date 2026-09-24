import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { chromium } from 'playwright'
import { preview } from 'vite'
import { referenceSteps, validateReferenceOutline } from './reference-contract.mjs'

const requestedSlug = process.argv[2]
const referenceSlug = 'how-to-make-a-presentation'
const slug = requestedSlug ?? referenceSlug
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
  phase = 'build'
  await run('npm', ['run', 'build'])
  phase = 'sample contract'
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  if (!registry.includes(`slug: '${slug}'`)) fail(`presentation ${slug} is missing from the registry`)
  if (!requestedSlug) {
    const source = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/index.tsx', import.meta.url), 'utf8')
    const issues = validateReferenceOutline(source)
    if (issues.length) fail(issues.join('; '))
    if (referenceSteps.length !== 9) fail('canonical outline must contain nine steps')
  }

  phase = 'preview startup'
  const probe = createServer()
  await new Promise((resolve, reject) => probe.listen(0, '127.0.0.1', resolve).once('error', reject))
  const address = probe.address()
  if (!address || typeof address === 'string') fail('could not reserve an IPv4 port')
  const port = address.port
  await new Promise((resolve) => probe.close(resolve))
  server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } })
  const baseUrl = `http://127.0.0.1:${port}`
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(baseUrl)).ok) break } catch {}
    if (attempt === 49) fail('production preview did not become ready at 127.0.0.1')
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  phase = 'browser render'
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
  if (!requestedSlug && count !== referenceSteps.length) fail(`expected 9 steps, found ${count}`)
  if (count < 1) fail('presentation exposes no steps')
  for (currentStep = 0; currentStep < count; currentStep++) {
    if (currentStep > 0) await page.keyboard.press('ArrowRight')
    try {
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, currentStep, { timeout: 5000 })
    } catch { fail(`step ${currentStep + 1} did not render or advance`) }
    await page.waitForTimeout(850)
    if (errors.length) fail(errors.join('; '))
  }
  if (errors.length) fail(errors.join('; '))
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
