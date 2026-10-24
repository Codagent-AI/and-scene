#!/usr/bin/env node
import { mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectSceneContent, collectSnapshot, DEFAULT_SETTLE_MS, DISTINCTION_PROPS, unsettledEntities, VIEWPORT, warningsForStep } from './lib/inspect-diagnostics.mjs'
import { closeAll, exitOnSignals, launchBrowser, runNpmBuild, startPreview } from './lib/preview.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs(argv) {
  const options = { slug: undefined, settleMs: Number(process.env.INSPECT_SETTLE_MS) || DEFAULT_SETTLE_MS, build: true }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--settle') options.settleMs = Number(argv[++i])
    else if (argv[i] === '--skip-build') options.build = false
    else if (!argv[i].startsWith('--')) options.slug = argv[i]
    else throw new Error(`unknown option ${argv[i]}`)
  }
  if (!options.slug) throw new Error('usage: npm run inspect -- <slug> [--settle <ms>] [--skip-build]')
  if (!(options.settleMs >= 0)) throw new Error('--settle must be a number of milliseconds')
  return options
}

/** Fonts loaded, then two samples a few frames apart show every entity still, opaque and painted. */
async function sceneSettled(page, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  await page.evaluate(() => document.fonts?.ready)
  let pending = ['scene']
  while (Date.now() < deadline) {
    const before = await page.evaluate(collectSceneContent)
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await page.waitForTimeout(100)
    pending = unsettledEntities(before, await page.evaluate(collectSceneContent))
    if (pending.length === 0) return []
  }
  return pending
}

const readIndex = (page) => page.evaluate(() => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')))

async function inspect({ slug, settleMs, build }) {
  if (build) await runNpmBuild(root)
  const outDir = path.join(root, 'inspection', slug)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  const preview = await startPreview(root)
  exitOnSignals(() => preview.stop())
  let browser
  let warningCount = 0
  try {
    browser = await launchBrowser()
    const page = await browser.newPage({ viewport: VIEWPORT })
    await page.goto(`${preview.url}/${slug}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    const total = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    for (let index = 0; index < total; index++) {
      const began = Date.now()
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((want) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === want, index, { timeout: 5000 })
          .catch(async () => {
            throw new Error(`step ${index + 1} of ${total}: ArrowRight did not advance to index ${index} (stayed at ${await readIndex(page)})`)
          })
      }
      await page.waitForTimeout(settleMs)
      const wrappersOpaque = await page
        .waitForFunction(
          () => [...document.querySelectorAll('[data-presentation-appear],[data-presentation-scene]')].every((el) => Number(getComputedStyle(el).opacity) >= 0.999),
          undefined,
          { timeout: 5000 },
        )
        .then(() => true, () => false)
      const pending = await sceneSettled(page)
      const settled = wrappersOpaque && pending.length === 0
      const file = path.join(outDir, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      const shown = await page.evaluate(() => ({
        index: Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')),
        title: document.querySelector('[data-presentation-title]')?.textContent ?? '',
      }))
      console.log(
        `captured ${path.basename(file)} ${Date.now() - began}ms after navigation (settle ${settleMs}ms) ` +
          `step ${shown.index + 1}/${total} "${shown.title}" ${settled ? 'settled' : 'UNSETTLED'}`,
      )
      if (!settled) {
        warningCount++
        console.log(`WARN step ${index + 1} settle: animations were still running at capture${pending.length ? ` (${pending.slice(0, 3).join('; ')})` : ''}; raise --settle`)
      }
      const warnings = warningsForStep(index + 1, await page.evaluate(collectSnapshot, DISTINCTION_PROPS))
      warningCount += warnings.length
      for (const warning of warnings) console.log(warning)
    }
    console.log(`inspected ${slug}: ${total} screenshots in ${path.relative(root, outDir)}/ (${warningCount} advisory warnings)`)
  } finally {
    await closeAll(browser, preview)
  }
}

try {
  await inspect(parseArgs(process.argv.slice(2)))
} catch (error) {
  console.error(`ERROR inspect: ${error.message}`)
  process.exitCode = 1
}
