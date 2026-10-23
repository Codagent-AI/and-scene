// Captures settled per-step screenshots from the production preview and prints advisory warnings.
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { waitForIndex } from './lib/checks.mjs'
import { captureSteps, parseInspectArgs, stepFileName } from './lib/inspect-checks.mjs'
import { snapshotPage } from './lib/page-snapshot.mjs'
import { withPreview } from './lib/preview.mjs'
import { readRegistry } from './lib/registry.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_VIEWPORT = '1440x900'

async function main() {
  const opts = parseInspectArgs(process.argv.slice(2))
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) throw new Error('no production build found; run `npm run build` first')
  if (!readRegistry(ROOT).some((e) => e.slug === opts.slug)) throw new Error(`"${opts.slug}" is not registered in src/presentations/index.ts`)

  const base = join(ROOT, '.inspection', opts.slug)
  const outDir = opts.viewport === DEFAULT_VIEWPORT ? base : join(base, opts.viewport)
  mkdirSync(outDir, { recursive: true })
  for (const f of readdirSync(outDir)) if (/^step-\d+\.png$/.test(f)) rmSync(join(outDir, f))

  const warnings = await withPreview(ROOT, async (baseUrl) => {
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height } })
      await page.goto(`${baseUrl}/${opts.slug}`, { waitUntil: 'load' })
      await page.waitForSelector('[data-step-count]', { timeout: 10000 })
      const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
      const read = async () => Number(await page.getAttribute('[data-step-index]', 'data-step-index'))
      return await captureSteps(page, {
        count,
        settleMs: opts.settleMs,
        shotPath: (n) => join(outDir, stepFileName(n)),
        snapshot: snapshotPage,
        waitForStep: (i) => waitForIndex(read, i, { from: i - 1 }),
        log: console.log,
      })
    } finally {
      await browser.close()
    }
  })
  console.log(`Inspected ${opts.slug} at ${opts.viewport}: screenshots in ${relative(ROOT, outDir)}, ${warnings.length} warning(s)`)
}

main().catch((err) => {
  console.error(`ERROR inspect: ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
