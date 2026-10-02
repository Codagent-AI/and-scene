import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'

const host = '127.0.0.1'
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PREVIEW_PORT ?? 4173)
const url = `http://${host}:${port}`
let preview
let previewExit
let previewError
let browser
try {
  const build = spawn('npm', ['run', 'build'], { cwd: project, stdio: 'inherit' })
  const code = await new Promise((resolve) => build.on('close', resolve))
  if (code !== 0) throw new Error(`Build failed with exit code ${code}`)
  preview = spawn(process.execPath, [resolve(project, 'node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: project, stdio: 'ignore' })
  preview.on('error', (error) => { previewError = error })
  preview.on('exit', (exitCode, signal) => { previewExit = { exitCode, signal } })
  const assertPreviewRunning = () => {
    if (previewError) throw new Error(`Preview could not start: ${previewError.message}`)
    if (previewExit) throw new Error(`Preview exited before verification completed (code ${previewExit.exitCode ?? 'none'}, signal ${previewExit.signal ?? 'none'})`)
  }
  let ready = false
  for (let attempt = 0; attempt < 80; attempt += 1) {
    assertPreviewRunning()
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  assertPreviewRunning()
  if (!ready) throw new Error(`Preview did not become ready at ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  const registry = await (await import('node:fs/promises')).readFile(resolve(project, 'src/presentations/index.ts'), 'utf8')
  const slug = registry.match(/slug:\s*['"]([^'"]+)['"]/)?.[1]
  if (!slug) throw new Error('No presentation is registered in src/presentations/index.ts')
  await page.goto(`${url}/${slug}`, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation]').waitFor()
  assertPreviewRunning()
  if (errors.length) throw new Error(`Render failed on first step: ${errors.join('; ')}`)
  console.log(`PASS: build and first-step render for /${slug}`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
