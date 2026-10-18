// Captures one settled screenshot per step of a registered presentation from a production
// preview and prints advisory visual warnings. Warnings never change the exit status; only
// operational failures (build, route, browser) do.
//
//   npm run inspect -- <slug> [--settle ms] [--viewport WxH] [--out dir] [--no-build]
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { chromium } from 'playwright'
import { collectDiagnostics, diagnosticOptions, formatWarnings } from './lib/diagnostics.mjs'
import {
  installSignalCleanup,
  projectRoot,
  runNpm,
  sleep,
  startPreview,
  stopAll,
} from './lib/runtime.mjs'
import { resolveSettleMs } from './lib/settle.mjs'

const STEP_TIMEOUT_MS = 5000
const DEFAULT_VIEWPORT = { width: 1440, height: 900 }

function parseArgs(argv) {
  const options = { slug: undefined, build: true, out: '.inspection', viewport: DEFAULT_VIEWPORT }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--no-build') options.build = false
    else if (arg === '--settle') options.settle = argv[++i]
    else if (arg === '--out') options.out = argv[++i]
    else if (arg === '--viewport') {
      const [width, height] = String(argv[++i]).split('x').map(Number)
      options.viewport = { width, height }
    } else if (!arg.startsWith('--') && !options.slug) options.slug = arg
    else throw new Error(`unknown argument: ${arg}`)
  }
  if (!options.slug) throw new Error('usage: npm run inspect -- <slug> [--settle ms] [--viewport WxH] [--out dir] [--no-build]')
  return options
}

const pad = (n) => String(n).padStart(2, '0')

async function main() {
  installSignalCleanup()
  const options = parseArgs(process.argv.slice(2))
  const settleMs = resolveSettleMs({ flag: options.settle })
  // the output directory is wiped below, so it must stay strictly inside the inspection root
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(options.slug)) throw new Error(`invalid slug: ${options.slug}`)
  const base = resolve(projectRoot, options.out)
  const outDir = resolve(base, options.slug)
  if (!outDir.startsWith(base + sep) || !base.startsWith(projectRoot + sep)) {
    throw new Error(`output path ${outDir} must be inside a dedicated directory under the project`)
  }
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  if (options.build) {
    console.log('[inspect] building')
    const { code, output } = await runNpm('build')
    if (code !== 0) {
      console.log(output.split('\n').slice(-40).join('\n'))
      throw new Error(`npm run build exited with code ${code}`)
    }
  }

  const preview = await startPreview()
  const url = `${preview.baseUrl}/${options.slug}`
  console.log(`[inspect] ${url} (settle ${settleMs} ms)`)
  const browser = await chromium.launch()
  const warnings = []
  const captures = []
  try {
    const page = await browser.newPage({ viewport: options.viewport })
    const startedAt = Date.now()
    await page.goto(url)
    try {
      await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS })
    } catch {
      throw new Error(`route /${options.slug} did not render a presentation`)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    const diagnose = (step) =>
      page.evaluate(collectDiagnostics, diagnosticOptions).then((found) => formatWarnings(step, found))

    // Active-chrome checks need browse chrome; look at it once if the deck opens in present mode.
    const openedIn = await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')
    if (openedIn === 'present') {
      await page.keyboard.press('p')
      await sleep(settleMs)
      const chrome = (await diagnose(0)).filter((w) => w.kind === 'active-chrome')
      warnings.push(...chrome)
      for (const warning of chrome) console.log(`WARN step ${warning.step} [${warning.kind}] ${warning.message}`)
      await page.keyboard.press('p')
    }

    for (let index = 0; index < count; index++) {
      let transitionAt = startedAt
      if (index > 0) {
        transitionAt = Date.now()
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (want) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === want,
          String(index),
          { timeout: STEP_TIMEOUT_MS },
        )
      }
      await sleep(settleMs)
      const runningAnimations = await page.evaluate(
        () => document.getAnimations().filter((a) => a.playState === 'running').length,
      )
      const stepWarnings = await diagnose(index)
      warnings.push(...stepWarnings)
      const file = join(outDir, `step-${pad(index + 1)}.png`)
      await page.screenshot({ path: file })
      const capturedAt = Date.now()
      const observedIndex = Number(await page.getAttribute('[data-step-index]', 'data-step-index'))
      captures.push({ index, observedIndex, file: `step-${pad(index + 1)}.png`, transitionAt, capturedAt, runningAnimations })
      console.log(`[inspect] step ${index} -> ${options.out}/${options.slug}/step-${pad(index + 1)}.png`)
      for (const warning of stepWarnings) console.log(`WARN step ${warning.step} [${warning.kind}] ${warning.message}`)
    }
  } finally {
    await browser.close()
  }
  writeFileSync(
    join(outDir, 'report.json'),
    JSON.stringify({ slug: options.slug, viewport: options.viewport, settleMs, captures, warnings }, null, 2),
  )
  console.log(`[inspect] done: ${captures.length} screenshots, ${warnings.length} advisory warnings`)
}

let code = 0
try {
  await main()
} catch (error) {
  console.error(`[inspect] FAIL: ${error?.message ?? error}`)
  code = 1
} finally {
  await stopAll()
}
process.exit(code)
