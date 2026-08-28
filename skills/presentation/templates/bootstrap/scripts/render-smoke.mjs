import { access, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const checkOnly = process.argv.includes('--check-only')
const port = 4173
const url = `http://127.0.0.1:${port}/starter`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))

async function assertStarter() {
  await access(new URL('../dist/index.html', import.meta.url))
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  if (!registry.includes("slug: 'starter'")) throw new Error('render smoke requires a registered starter route')
}

async function waitForPreview(preview) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`preview exited before becoming ready (exit ${preview.exitCode})`)
    try { if ((await fetch(url)).ok) return } catch { /* preview is still starting */ }
    await delay(150)
  }
  throw new Error(`preview did not become ready at ${url}`)
}

await assertStarter()
if (checkOnly) {
  console.log('render smoke preflight passed')
  process.exit(0)
}

const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
try {
  await waitForPreview(preview)
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation="true"]').waitFor()
  await browser.close()
  if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`)
  console.log('render smoke passed')
} finally {
  preview.kill('SIGTERM')
}
