import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { PREVIEW_URL, run, startPreview } from './preview.mjs'
import { diagnose } from './diagnose.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const slug = process.argv[2] || 'how-to-make-a-presentation'
const output = join(root, 'artifacts/inspection')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const warnings = []
await run('npm', ['run', 'build'], root)
const preview = await startPreview(root)
try {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(new URL(slug, PREVIEW_URL).href, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation]').waitFor()
    const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
    await mkdir(output, { recursive: true })
    for (let index = 0; index < count; index += 1) {
      if (!preview.alive()) throw new Error(`preview exited during inspection at step ${index + 1}`)
      await page.waitForTimeout(700)
      await page.screenshot({ path: join(output, `${slug}-${index}.png`), fullPage: true })
      warnings.push(...await page.evaluate(diagnose, index))
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    for (const error of errors) warnings.push(`step runtime error: ${error}`)
    console.log(`inspect: captured ${count} settled steps for ${packageJson.name}`)
  } finally { await browser.close() }
} finally {
  await preview.stop()
}

for (const warning of warnings) console.warn(`inspect warning [${slug}]: ${warning}`)
