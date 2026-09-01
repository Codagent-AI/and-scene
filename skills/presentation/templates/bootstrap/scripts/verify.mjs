import { spawn, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const host = '127.0.0.1'
const port = Number(process.env.PRESENTATION_PORT ?? 4173)
const requestedSlug = process.argv[2]

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`)
}

async function registeredSlug() {
  if (requestedSlug) return requestedSlug
  const source = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const match = source.match(/slug:\s*['"]([^'"]+)['"]/) 
  if (!match) throw new Error('No registered presentation was found. Add a presentation before verification.')
  return match[1]
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

run('npm', ['run', 'build'])
const slug = await registeredSlug()
const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
let browser

try {
  const url = `http://${host}:${port}/${slug}`
  await waitForServer(url)
  const { chromium } = await import('playwright')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-presentation-chrome="true"]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('The presentation did not expose a valid step count.')
  for (let index = 0; index < count; index += 1) {
    if (Number(await chrome.getAttribute('data-step-index')) !== index) throw new Error(`Step ${index + 1} did not render.`)
    await page.waitForTimeout(600)
    if (errors.length) throw new Error(`Browser error at step ${index + 1}: ${errors.join('; ')}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(
        ({ expected }) => document.querySelector('[data-presentation-chrome="true"]')?.getAttribute('data-step-index') === String(expected),
        { expected: index + 1 },
        { timeout: 2_000 },
      )
    }
  }
  if (errors.length) throw new Error(`Browser error while rendering ${slug}: ${errors.join('; ')}`)
  console.log(`PASS: built and rendered ${slug} through ${count} steps.`)
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
