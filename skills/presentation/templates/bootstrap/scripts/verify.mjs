import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run verify -- <presentation-slug>')
const host = '127.0.0.1'
const port = Number(process.env.PRESENTATION_PREVIEW_PORT ?? 4178)
const origin = `http://${host}:${port}`
let preview
let browser

function command(executable, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${executable} exited with code ${code}`)))
  })
}

async function closePreview(server) {
  if (!server?.httpServer.listening) return
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
}

try {
  await command(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'])
  preview = await startPreview({ preview: { host, port, strictPort: true } })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  let currentStep = 0
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(new Error(`console error: ${message.text()}`))
  })
  page.on('pageerror', (error) => errors.push(error))

  await page.goto(`${origin}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`/${slug} did not expose a valid data-step-count`)
  for (currentStep = 0; currentStep < count; currentStep += 1) {
    await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, currentStep)
    const scene = page.locator('[data-presentation-scene]').last()
    await scene.waitFor({ state: 'visible' })
    await page.waitForTimeout(Number(process.env.PRESENTATION_SETTLE_MS ?? 900))
    if (await scene.locator(':scope *:visible').count() === 0) throw new Error(`step ${currentStep} rendered no visible scene content`)
    if (errors.length) throw new Error(`step ${currentStep}: ${errors.splice(0).map((error) => error.message).join('; ')}`)
    if (currentStep < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, currentStep + 1)
    }
  }
  console.log(`PASS: build and rendered ${count} step(s) at ${origin}/${slug}`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await closePreview(preview)
}
