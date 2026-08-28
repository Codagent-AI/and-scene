import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const port = 4173
const url = `http://127.0.0.1:${port}/starter`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`build phase failed (${command} ${args.join(' ')}, exit ${code})`)))
  })
}

async function waitForPreview(preview) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`preview phase failed: process exited before becoming ready (exit ${preview.exitCode})`)
    try { if ((await fetch(url)).ok) return } catch { /* preview is still starting */ }
    await delay(150)
  }
  throw new Error(`preview phase failed: server did not become ready at ${url}`)
}

async function verifyStarter() {
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  if (!registry.includes("slug: 'starter'")) throw new Error('reference sample phase failed: starter route is not registered')
  const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
  let browser
  let step = 0
  const errors = []
  try {
    await waitForPreview(preview)
    const { chromium } = await import('playwright')
    browser = await chromium.launch()
    const page = await browser.newPage()
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${step + 1}: console error: ${message.text()}`) })
    page.on('pageerror', (error) => errors.push(`step ${step + 1}: page error: ${error.message}`))
    await page.goto(url, { waitUntil: 'networkidle' })
    const deck = page.locator('[data-presentation="true"]')
    await deck.waitFor()
    const count = Number(await deck.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('render phase failed: invalid public step count')
    for (step = 0; step < count; step += 1) {
      if (errors.length) throw new Error(`render phase failed at ${errors[0]}`)
      if (Number(await deck.getAttribute('data-step-index')) !== step) throw new Error(`render phase failed at step ${step + 1}: expected public step index ${step}`)
      if (step < count - 1) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction((expected) => document.querySelector('[data-presentation="true"]')?.getAttribute('data-step-index') === String(expected), step + 1)
        } catch {
          throw new Error(`render phase failed at step ${step + 2}: public step index did not advance`)
        }
      }
    }
    if (errors.length) throw new Error(`render phase failed at ${errors[0]}`)
  } finally {
    await browser?.close()
    preview.kill('SIGTERM')
  }
}

try {
  await run('npm', ['run', 'build'])
  await verifyStarter()
  console.log('verify: PASS — starter presentation rendered cleanly on 127.0.0.1')
} catch (error) {
  console.error(`verify: FAIL — ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
