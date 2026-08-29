import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = 4173

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // The preview process is still starting.
    }
    await delay(250)
  }
  throw new Error(`Preview did not become ready at ${url}`)
}

if (!slug) {
  throw new Error('Usage: npm run verify -- <presentation-slug>')
}

let preview
let browser
try {
  await run('npm', ['run', 'build'])
  preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port)], { stdio: 'inherit' })
  await waitForPreview(`http://${host}:${port}/`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto(`http://${host}:${port}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor()
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('Presentation did not expose a valid data-step-count.')

  for (let index = 0; index < count; index += 1) {
    if (await root.getAttribute('data-step-index') !== String(index)) {
      throw new Error(`Step ${index + 1} did not become active.`)
    }
    if (errors.length) throw new Error(`Step ${index + 1} failed: ${errors.join('; ')}`)
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`VERIFY PASS: ${slug} rendered ${count} steps.`)
} catch (error) {
  console.error(`VERIFY FAIL: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview) {
    preview.kill('SIGTERM')
    await once(preview, 'exit').catch(() => undefined)
  }
}
