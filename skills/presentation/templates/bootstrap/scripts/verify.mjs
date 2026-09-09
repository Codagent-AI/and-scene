import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = 4173
const settleMs = 700
const root = process.cwd()

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve())
  })
}

let server
let browser
let activeStep = 0
const errors = []

try {
  if (!slug) throw new Error('provide a registered presentation slug: npm run verify -- <slug>')
  await run('npm', ['run', 'build'])
  server = await startPreview({ root, preview: { host, port, strictPort: true } })
  const url = `http://${host}:${port}/${slug}`
  const readiness = await fetch(`http://${host}:${port}/`)
  if (!readiness.ok) throw new Error(`preview readiness probe failed (${readiness.status})`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${activeStep + 1}: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`step ${activeStep + 1}: ${error.message}`))
  await page.goto(url, { waitUntil: 'networkidle' })
  if (errors.length) throw new Error(errors.join('; '))

  const presentation = page.locator('[data-presentation-root]')
  if (await presentation.count() !== 1) throw new Error(`route /${slug} did not render a presentation`)
  const count = Number(await presentation.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`route /${slug} did not expose a positive data-step-count`)

  for (activeStep = 0; activeStep < count; activeStep += 1) {
    await page.waitForTimeout(settleMs)
    if (errors.length) throw new Error(errors.join('; '))
    if (await presentation.getAttribute('data-step-index') !== String(activeStep)) throw new Error(`step ${activeStep + 1} did not become active`)
    if (activeStep < count - 1) {
      await page.keyboard.press('ArrowRight')
      await presentation.waitFor({ state: 'attached' })
      await page.waitForFunction((index) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(index), activeStep + 1)
    }
  }
  if (errors.length) throw new Error(errors.join('; '))
  console.log(`VERIFY PASS: /${slug} built and rendered ${count} steps on ${host}`)
} catch (error) {
  console.error(`VERIFY FAIL${activeStep >= 0 ? ` at step ${activeStep + 1}` : ''}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  try {
    await browser?.close()
  } finally {
    if (server) await closeServer(server)
  }
}
