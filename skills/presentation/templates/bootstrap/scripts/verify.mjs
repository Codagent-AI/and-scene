import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { getAvailablePort, run, waitForPreview, watchPreview } from './preview-server.mjs'

const slug = process.argv[2]
const host = '127.0.0.1'

if (!slug) {
  throw new Error('Usage: npm run verify -- <presentation-slug>')
}

let preview
let browser
let markerPath
try {
  await run('npm', ['run', 'build'])
  const port = await getAvailablePort(host)
  const marker = randomUUID()
  markerPath = resolve('dist', '.and-scene-verify-marker')
  await writeFile(markerPath, marker)
  preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  const getPreviewFailure = watchPreview(preview)
  const previewUrl = `http://${host}:${port}`
  await waitForPreview(`${previewUrl}/.and-scene-verify-marker`, getPreviewFailure)
  const markerResponse = await fetch(`${previewUrl}/.and-scene-verify-marker`)
  if (await markerResponse.text() !== marker) throw new Error('Preview did not serve this verification run\'s build marker.')

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto(`${previewUrl}/${slug}`, { waitUntil: 'networkidle' })
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
  if (markerPath) await rm(markerPath, { force: true })
}
