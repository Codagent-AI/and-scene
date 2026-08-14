import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const baseUrl = `http://${host}:${port}`
const slug = process.argv[2]

if (!slug) {
  console.error('VERIFY FAILED: provide a presentation slug, for example: npm run verify -- my-presentation')
  process.exit(1)
}

function runBuild() {
  console.log('VERIFY: building app')
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit' })
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // The preview server is still starting.
    }
    await delay(100)
  }
  throw new Error(`preview did not become ready at ${baseUrl}`)
}

async function verify() {
  runBuild()
  const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  const stop = async () => {
    if (!server.killed) server.kill('SIGTERM')
    await once(server, 'exit').catch(() => undefined)
  }

  try {
    await waitForPreview()
    const browser = await chromium.launch()
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`presentation route /${slug} did not expose a valid data-step-count`)
    for (let index = 0; index < count; index += 1) {
      if (Number(await root.getAttribute('data-step-index')) !== index) throw new Error(`step ${index} did not become active`)
      if (errors.length) throw new Error(`step ${index} emitted: ${errors.join('; ')}`)
      if (index < count - 1) await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(500)
    }
    await browser.close()
    console.log(`VERIFY PASSED: rendered ${count} step${count === 1 ? '' : 's'} at /${slug}`)
  } finally {
    await stop()
  }
}

verify().catch((error) => {
  console.error(`VERIFY FAILED: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
