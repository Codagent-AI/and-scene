import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const requestedSlug = process.argv[2]

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Preview has not started yet.
    }
    await delay(125)
  }
  throw new Error(`Preview did not become ready at ${url}`)
}

async function main() {
  await run('npm', ['run', 'build'])
  const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit', shell: process.platform === 'win32' })
  try {
    const url = `http://${host}:${port}${requestedSlug ? `/${requestedSlug.replace(/^\/+/, '')}` : '/'}`
    await waitForPreview(url)
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      const errors = []
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(url, { waitUntil: 'networkidle' })
      const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error(`Presentation did not render at ${url}`)
      for (let index = 0; index < count; index += 1) {
        await page.waitForFunction((expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === expected, String(index))
        if (errors.length) throw new Error(`Browser errors at step ${index + 1}: ${errors.join('; ')}`)
        if (index + 1 < count) await page.keyboard.press('ArrowRight')
      }
      if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
    } finally {
      await browser.close()
    }
  } finally {
    preview.kill('SIGTERM')
    await once(preview, 'exit').catch(() => undefined)
  }
}

main().then(() => console.log('Presentation verification passed.')).catch((error) => {
  console.error(`Presentation verification failed: ${error.message}`)
  process.exitCode = 1
})
