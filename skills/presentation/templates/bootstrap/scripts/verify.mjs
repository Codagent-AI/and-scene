import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium, installSignalCleanup, rootPath, startPreview, stopPreview, waitForStep } from './preview-utils.mjs'

let preview
let browser
installSignalCleanup(() => ({ child: preview?.child, browser }))
const run = spawnSync('npm', ['run', 'build'], { cwd: rootPath, encoding: 'utf8' })
if (run.status !== 0) throw new Error(`build failed: ${(run.stderr || run.stdout || '').trim()}`)
console.log('[PASS] build')
const source = await readFile(fileURLToPath(new URL('../src/presentations/index.ts', import.meta.url)), 'utf8')
const entries = [...source.matchAll(/slug:\s*'([^']+)'/g)].map(match => match[1])
if (!entries.length) throw new Error('presentation registry has no entries')
try {
  preview = await startPreview({ onUrl: url => console.log(`[INFO] preview=${url}`) })
  browser = await chromium()
  const page = await browser.newPage()
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  for (const slug of entries) {
    await page.goto(`${preview.url}/${slug}`, { waitUntil: 'networkidle' })
    const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
    if (!count) throw new Error(`${slug}: no registered steps rendered`)
    if (Number(await page.locator('[data-step-index]').first().getAttribute('data-step-index')) !== 0) throw new Error(`${slug}: first step did not render`)
    for (let index = 1; index < count; index++) {
      await page.keyboard.press('ArrowRight')
      await waitForStep(page, index)
    }
    if (errors.length) throw new Error(`${slug}: ${errors[0]}`)
    console.log(`[PASS] render ${slug}: ${count} steps`)
  }
} finally {
  await browser?.close()
  await stopPreview(preview?.child)
}
console.log('PASS: build and registered presentation render')
