import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 4173)
const baseUrl = `http://${host}:${port}`
const npmOptions = { stdio: 'inherit', shell: process.platform === 'win32' }
let preview
let previewExited = false
let browser
try {
  const build = spawn('npm', ['run', 'build'], npmOptions)
  const buildStatus = await new Promise((resolve, reject) => {
    build.once('error', reject)
    build.once('close', resolve)
  })
  if (buildStatus !== 0) throw new Error(`Build failed with exit code ${buildStatus}`)

  try {
    const occupied = await fetch(baseUrl, { signal: AbortSignal.timeout(150) })
    if (occupied) throw new Error(`Port ${port} is already serving content at ${baseUrl}`)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Port ')) throw error
  }
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  preview.once('error', () => { previewExited = true })
  preview.once('exit', () => { previewExited = true })
  await delay(150)
  if (previewExited) throw new Error(`Preview process exited before becoming ready at ${baseUrl}`)
  let ready = false
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (previewExited) throw new Error(`Preview process exited before becoming ready at ${baseUrl}`)
    try {
      const response = await fetch(baseUrl)
      if (response.ok && (await response.text()).includes('<div id="root">') && !previewExited) { ready = true; break }
    } catch {}
    await delay(200)
  }
  if (!ready) throw new Error(`Preview did not become ready at ${baseUrl}`)
  const slug = process.env.PRESENTATION_SLUG ?? 'starter'
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
  const presentation = page.locator('[data-presentation]')
  await presentation.waitFor()
  const count = Number(await presentation.getAttribute('data-step-count'))
  if (!count) throw new Error(`Route /${slug} exposed no presentation steps`)
  for (let index = 0; index < count; index += 1) {
    const actual = Number(await presentation.getAttribute('data-step-index'))
    if (actual !== index) throw new Error(`Step ${index} did not render (observed ${actual})`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(`PASS: build and ${count}-step render check for /${slug} at ${baseUrl}`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview && !previewExited && preview.exitCode === null && preview.signalCode === null) {
    await new Promise((resolve) => { preview.once('close', resolve); preview.kill('SIGTERM') })
  }
}
