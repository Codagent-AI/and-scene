#!/usr/bin/env node
// `npm run inspect -- <slug>`: capture one settled screenshot per step from a production
// preview, with advisory warnings about collisions and unpolished chrome. Screenshots
// and warnings are inspection artifacts for a human or agent to review, not pass/fail.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { analyze, collectPageData, settle } from './lib/diagnostics.mjs'
import { previewUrl, startPreview } from './lib/preview.mjs'

const root = path.resolve(import.meta.dirname, '..')

function parseArgs(argv) {
  const options = { slug: null, viewport: '1440x900', settle: 1300, build: true, out: path.join(root, '.inspection') }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--viewport') options.viewport = argv[++i]
    else if (arg === '--settle') options.settle = Number(argv[++i])
    else if (arg === '--out') options.out = path.resolve(argv[++i])
    else if (arg === '--no-build') options.build = false
    else if (!arg.startsWith('--') && !options.slug) options.slug = arg
    else throw new Error(`unknown argument: ${arg}`)
  }
  const match = /^(\d+)x(\d+)$/.exec(options.viewport ?? '')
  if (!options.slug || !match || !(options.settle >= 0)) {
    throw new Error('usage: npm run inspect -- <slug> [--viewport 1440x900] [--settle 1300] [--out dir] [--no-build]')
  }
  options.size = { width: Number(match[1]), height: Number(match[2]) }
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.build) {
    const build = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' })
    if (build.status !== 0) throw new Error(`npm run build failed\n${build.stdout}\n${build.stderr}`)
  }
  const outDir = path.join(options.out, options.slug, `${options.size.width}x${options.size.height}`)
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })

  const preview = await startPreview(root, (line) => console.log(`[inspect] ${line}`))
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: options.size })
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(previewUrl(preview.port, `/${options.slug}`), { waitUntil: 'load' })
    const hook = page.locator('[data-step-count]')
    await hook.waitFor({ timeout: 10_000 }).catch(() => {
      throw new Error(`presentation "${options.slug}" did not render (no [data-step-count] hook)${errors.length ? `: ${errors[0]}` : ''}`)
    })
    const count = Number(await hook.getAttribute('data-step-count'))

    const reported = new Set()
    const warnings = []
    const captures = []
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((want) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(want), i, { timeout: 5000 })
      }
      const advancedAt = Date.now()
      await settle(page, options.settle)
      const capturedAt = Date.now()
      const file = path.join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      captures.push({ step: i + 1, file: path.relative(root, file), advancedAt, capturedAt, settleMs: options.settle })
      warnings.push(...analyze(i + 1, await page.evaluate(collectPageData), reported))
    }
    fs.writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify({ slug: options.slug, viewport: options.size, steps: count, captures, warnings, errors }, null, 2)}\n`)

    console.log(`[inspect] ${count} screenshot(s) written to ${path.relative(root, outDir)}`)
    for (const w of warnings) console.log(`WARN [advisory] step ${w.step} ${w.kind}: ${w.message}`)
    for (const e of errors) console.log(`ERROR browser: ${e}`)
    console.log(`[inspect] ${warnings.length} advisory warning(s); advisory warnings never change the exit code and are not a pass/fail result`)
    if (errors.length) process.exitCode = 1
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

main().catch((error) => {
  console.error(`INSPECT FAIL: ${error?.message ?? error}`)
  process.exitCode = 1
})
