// Capture a settled screenshot of every step of a registered presentation from a production
// preview, and print advisory visual-quality warnings. Warnings never fail the run.
//
//   npm run inspect -- <slug> [--narrow | --viewport WxH] [--settle ms] [--skip-build] [--out dir]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { PhaseError, readFlag, readRegistrySlugs, reportFailure, runBuild, startPreview } from './lib/preview.mjs'

const argv = process.argv.slice(2)
const slug = argv.find((a, i) => !a.startsWith('--') && !['--viewport', '--settle', '--out', '--root'].includes(argv[i - 1]))
const root = resolve(readFlag(argv, '--root') ?? process.cwd())
const settleMs = Number(readFlag(argv, '--settle') ?? 1200)
const viewportText = argv.includes('--narrow') ? '390x844' : (readFlag(argv, '--viewport') ?? '1280x720')
const [width, height] = viewportText.split('x').map(Number)
const suffix = argv.includes('--narrow') ? '-narrow' : readFlag(argv, '--viewport') ? `-${viewportText}` : ''

/** Runs in the page: returns advisory findings for the settled step. */
function diagnose() {
  const findings = []
  const hidden = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return true
    }
    return false
  }
  const describe = (text) => (text.length > 40 ? `${text.slice(0, 37)}...` : text)

  // Visible text runs and chrome controls, as boxes.
  const items = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim()
    const el = node.parentElement
    if (!text || !el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName) || hidden(el)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rect = range.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) items.push({ el, rect, label: `"${describe(text)}"` })
  }
  const CHROME =
    '[data-presentation-progress-item], [data-presentation-toc-item], [data-presentation-prev], [data-presentation-next], [data-presentation-attribution]'
  for (const el of document.querySelectorAll(CHROME)) {
    const rect = el.getBoundingClientRect()
    if (!hidden(el) && rect.width > 0 && rect.height > 0) {
      const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.value === '' )
      items.push({ el, rect, label: `[${hook?.name ?? el.tagName.toLowerCase()}]` })
    }
  }
  const exempt = (el) => el.closest('[data-presentation-allow-overlap]') !== null
  const seen = new Set()
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el) || exempt(a.el) || exempt(b.el)) continue
      const ix = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const iy = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (ix <= 2 || iy <= 2) continue
      const key = `${a.label} ↔ ${b.label}`
      if (seen.has(key)) continue
      seen.add(key)
      findings.push({ type: 'overlap', detail: `${a.label} overlaps ${b.label} (mark intentional overlap with data-presentation-allow-overlap)` })
    }
  }

  // Active navigation must look different from inactive navigation.
  const signature = (el) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return [
      s.backgroundColor, s.color, s.borderTopColor, s.borderLeftColor, s.borderLeftWidth, s.outlineStyle,
      s.boxShadow, s.opacity, s.fontWeight, s.textDecorationLine, s.transform, s.filter,
      Math.round(r.width), Math.round(r.height),
    ].join('|')
  }
  for (const [name, selector] of [
    ['progress', '[data-presentation-progress-item]'],
    ['table-of-contents', '[data-presentation-toc-item]'],
  ]) {
    const group = [...document.querySelectorAll(selector)].filter((el) => !hidden(el))
    if (group.length < 2) continue
    const active = group.filter((el) => el.getAttribute('aria-current'))
    const inactive = group.filter((el) => !el.getAttribute('aria-current'))
    if (active.length === 0) {
      findings.push({ type: 'active-chrome', detail: `${name} exposes no aria-current entry` })
    } else if (inactive.every((el) => signature(el) === signature(active[0]))) {
      findings.push({
        type: 'active-chrome',
        detail: `active ${name} entry looks identical to inactive ones (style [${selector.slice(1, -1)}][data-presentation-active="true"])`,
      })
    }
  }

  // Attribution should be present and deliberately styled.
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    findings.push({ type: 'attribution', detail: 'no [data-presentation-attribution] link is rendered' })
  } else if (!hidden(attribution)) {
    const s = getComputedStyle(attribution)
    const problems = []
    if (parseFloat(s.fontSize) < 11) problems.push(`font-size ${s.fontSize} is undersized`)
    if (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(s.color)) problems.push('uses the browser-default link color')
    if (problems.length) {
      findings.push({ type: 'attribution', detail: `${problems.join(' and ')}; style [data-presentation-attribution]` })
    }
  }
  return findings
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  if (!slug) throw new PhaseError('usage', 'usage: npm run inspect -- <slug> [--narrow] [--viewport WxH] [--settle ms] [--skip-build]')
  if (!readRegistrySlugs(root).includes(slug)) throw new PhaseError('usage', `"${slug}" is not registered in src/presentations/index.ts`)
  if (!argv.includes('--skip-build')) runBuild(root)

  const outDir = resolve(root, readFlag(argv, '--out') ?? join('.presentation-artifacts', `${slug}${suffix}`))
  mkdirSync(outDir, { recursive: true })
  const preview = await startPreview(root)
  let browser
  const report = { slug, viewport: { width, height }, settleMs, steps: [], warnings: [] }
  const grouped = new Map()
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto(`${preview.url}/${slug}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-step-count]', { timeout: 15000 })
    const hook = (name) => page.locator('[data-presentation-root]').getAttribute(name)
    const count = Number(await hook('data-step-count'))
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (want) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === want,
          String(i),
          { timeout: 4000 },
        )
      }
      const navigatedAt = Date.now()
      await sleep(settleMs)
      const capturedAt = Date.now()
      const file = join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      report.steps.push({ step: i + 1, title: await hook('data-presentation-title'), file, navigatedAt, capturedAt })
      for (const f of await page.evaluate(diagnose)) {
        const key = `${f.type}\u0000${f.detail}`
        grouped.set(key, { ...f, steps: [...(grouped.get(key)?.steps ?? []), i + 1] })
      }
    }
  } finally {
    await browser?.close()
    await preview.stop()
  }
  report.warnings = [...grouped.values()]
  writeFileSync(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  for (const w of report.warnings) {
    console.log(`WARN [${w.type}] ${w.steps.length === 1 ? 'step' : 'steps'} ${w.steps.join(', ')}: ${w.detail}`)
  }
  console.log(`inspect: ${report.steps.length} screenshots in ${outDir}; ${report.warnings.length} advisory warning(s)`)
}

main().catch((error) => {
  reportFailure(error)
  process.exit(1)
})
