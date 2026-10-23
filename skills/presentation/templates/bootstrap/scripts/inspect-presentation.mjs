// Captures one settled screenshot per step from a production preview on 127.0.0.1
// and prints advisory visual warnings. Warnings never change the exit code.
// Usage: node scripts/inspect-presentation.mjs <slug> [--out dir] [--settle ms]
//        [--width px] [--height px] [--mode browse|present] [--skip-build]
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectDiagnostics } from './lib/diagnostics.mjs'
import {
  launchBrowser,
  readHooks,
  readRegistry,
  run,
  sleep,
  startPreview,
  waitForIndex,
} from './lib/runtime.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const slug = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
const settleMs = Number(flag('settle', 1200))
const width = Number(flag('width', 1440))
const height = Number(flag('height', 900))
const mode = flag('mode', null)
const outDir = path.resolve(root, flag('out', path.join('.presentation-inspect', slug ?? '')))

if (!slug) {
  console.error('usage: node scripts/inspect-presentation.mjs <slug> [--out dir] [--settle ms]')
  process.exit(2)
}
if (!readRegistry(root).some((e) => e.slug === slug)) {
  console.error(`inspect: "${slug}" is not a registered presentation`)
  process.exit(2)
}

if (!args.includes('--skip-build')) {
  const { code, output } = await run('npm', ['run', 'build'], { cwd: root, label: 'build' })
  if (code !== 0) {
    console.error(`inspect: build failed\n${output}`)
    process.exit(1)
  }
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const preview = await startPreview(root)
const browser = await launchBrowser(root)
const report = { slug, viewport: { width, height }, settleMs, steps: [] }
try {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(`${preview.origin}/${slug}`, { waitUntil: 'load' })
  await page.waitForSelector('[data-presentation-root]')
  if (mode && (await readHooks(page)).mode !== mode) await page.keyboard.press('p')
  const { count } = await readHooks(page)

  for (let i = 0; i < count; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      await waitForIndex(page, i)
    }
    await sleep(settleMs)
    const stable = await page.evaluate(async () => {
      const snap = () =>
        [...document.querySelectorAll('[data-presentation-node]')]
          .map((el) => {
            const r = el.getBoundingClientRect()
            const opacity = getComputedStyle(el).opacity
            return `${r.x.toFixed(1)},${r.y.toFixed(1)},${r.width.toFixed(1)},${r.height.toFixed(1)},${opacity}`
          })
          .join(';')
      const before = snap()
      await new Promise((r) => setTimeout(r, 120))
      return { settled: before === snap(), running: document.getAnimations().length }
    })
    const file = `step-${String(i + 1).padStart(2, '0')}.png`
    await page.screenshot({ path: path.join(outDir, file) })
    const d = await page.evaluate(collectDiagnostics)
    const warnings = [
      ...d.overlaps.map((w) => ({ kind: 'overlap', message: w })),
      ...d.indistinct.map((w) => ({ kind: 'active-chrome', message: w })),
      ...d.attribution.map((w) => ({ kind: 'attribution', message: w })),
    ]
    report.steps.push({ step: i + 1, file, settled: stable.settled, animationsRunning: stable.running, warnings })
    for (const w of warnings) console.log(`inspect: WARN step ${i + 1} [${w.kind}] ${w.message}`)
  }
} finally {
  await browser.close()
  await preview.stop()
}

writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
const total = report.steps.reduce((n, s) => n + s.warnings.length, 0)
console.log(`inspect: wrote ${report.steps.length} screenshots to ${path.relative(root, outDir)}`)
console.log(`inspect: ${total} advisory warning(s)`)
