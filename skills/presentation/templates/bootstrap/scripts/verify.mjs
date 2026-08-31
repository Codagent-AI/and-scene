import { spawn } from 'node:child_process'
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
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch { /* preview is still starting */ }
    await delay(100)
  }
  throw new Error(`Preview did not become ready at ${url}`)
}

if (!slug) throw new Error('Usage: npm run verify -- <presentation-slug>')

await run('npm', ['run', 'build'])
const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser

try {
  const url = `http://${host}:${port}/${slug}`
  await waitForPreview(url)
  browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-step-count][data-step-index]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`No renderable steps found at ${url}`)
  for (let index = 0; index < count; index += 1) {
    if (Number(await chrome.getAttribute('data-step-index')) !== index) throw new Error(`Step transition failed at step ${index}`)
    if (errors.length) throw new Error(`Browser error at step ${index}: ${errors.join('; ')}`)
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`PASS: ${slug} rendered ${count} steps on ${host}`)
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
