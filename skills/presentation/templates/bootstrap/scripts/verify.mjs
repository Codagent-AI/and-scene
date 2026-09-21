import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { PREVIEW_URL, run, startPreview } from './preview.mjs'
import { registeredSlugs, validateSlug } from './presentations.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
if (!pkg.scripts?.build) throw new Error('verify: missing build script')

const requestedSlug = process.argv[2]
const slugs = requestedSlug ? [validateSlug(requestedSlug)] : await registeredSlugs(root)

await run('npm', ['run', 'build'], root)
const preview = await startPreview(root)
try {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const slug of slugs) await Promise.race([verifyRoute(browser, slug), preview.failure])
    if (!preview.alive()) throw new Error('verify: preview exited during browser verification')
  } finally {
    await browser.close()
  }
  console.log(`verify: build and browser render passed for ${slugs.join(', ')}`)
} finally {
  await preview.stop()
}

async function verifyRoute(browser, slug) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto(new URL(slug, PREVIEW_URL).href, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation]').waitFor()
    if (errors.length) throw new Error(`verify: browser errors on ${slug}: ${errors.join('; ')}`)
  } finally {
    await page.close()
  }
}
