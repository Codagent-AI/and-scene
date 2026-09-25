import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'

const base = 'http://127.0.0.1:4173'
let previewServer
let browser
try {
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })
  const buildCode = await new Promise((resolve, reject) => {
    build.once('error', reject)
    build.once('exit', (code) => resolve(code ?? 1))
  })
  if (buildCode !== 0) throw new Error(`Build failed with exit code ${buildCode}`)

  previewServer = await startPreview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } })

  browser = await chromium.launch({ headless: true })
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const slugs = [...registry.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
  if (!slugs.length) throw new Error('No presentation is registered in src/presentations/index.ts')
  // Render every registered presentation so a newly generated route is always checked.
  for (const slug of slugs) {
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}/${slug}`)
    await page.locator('[data-step-count]').waitFor()
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    if (!count) throw new Error(`${base}/${slug}: registered presentation exposes no steps`)
    for (let index = 0; index < count; index += 1) {
      const observed = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
      if (observed !== index) throw new Error(`${base}/${slug}: step transition failed: expected ${index}, observed ${observed}`)
      await page.waitForTimeout(800)
      if (index + 1 < count) await page.keyboard.press('ArrowRight')
    }
    if (errors.length) throw new Error(`${base}/${slug}: browser errors: ${errors.join('; ')}`)
    console.log(`PASS: built and rendered ${count} step(s) at ${base}/${slug}`)
    await page.close()
  }
} catch (error) {
  console.error(`VERIFY FAILED: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  try {
    await browser?.close()
  } finally {
    if (previewServer) await new Promise((resolve, reject) => previewServer.httpServer.close((error) => error ? reject(error) : resolve()))
  }
}
