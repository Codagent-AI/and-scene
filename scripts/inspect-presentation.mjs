// Captures a settled screenshot of every step of a presentation from a production preview and
// prints advisory visual warnings. Screenshots and warnings are inspection aids, not a gate.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium, runBuild, sleep, startPreview } from './lib/preview.mjs'

const STEP_TIMEOUT = 5000

function parseArgs(argv) {
  const args = {
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    slug: undefined,
    out: undefined,
    settle: 900,
    viewport: { width: 1440, height: 900 },
    mode: 'browse',
    build: undefined,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--root') args.root = path.resolve(argv[++i])
    else if (a === '--out') args.out = path.resolve(argv[++i])
    else if (a === '--settle') args.settle = Number(argv[++i])
    else if (a === '--mode') args.mode = argv[++i]
    else if (a === '--viewport') {
      const [width, height] = argv[++i].split('x').map(Number)
      args.viewport = { width, height }
    } else if (a === '--build') args.build = true
    else if (a === '--no-build') args.build = false
    else if (!a.startsWith('--')) args.slug = a
  }
  return args
}

/** Runs in the page: returns advisory findings for the active step. */
function diagnose() {
  const CHROME =
    '[data-presentation-title],[data-presentation-caption],[data-presentation-marker],[data-presentation-mode-toggle],[data-presentation-nav],[data-presentation-progress-item],[data-presentation-toc-item],[data-presentation-attribution]'
  const visible = (el) => {
    for (let n = el; n instanceof Element; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false
    }
    return true
  }
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name === 'data-presentation-entity')
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24)
    const name = hook
      ? `[entity ${hook.value}]`
      : (CHROME.split(',').find((s) => el.matches(s)) ?? el.tagName.toLowerCase())
    return text ? `${name} "${text}"` : name
  }
  const items = []
  const add = (el, rect) => {
    if (rect.width > 0 && rect.height > 0 && visible(el)) items.push({ el, rect })
  }
  for (const el of document.querySelectorAll(CHROME)) {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (hasText) {
      const range = document.createRange()
      range.selectNodeContents(el)
      add(el, range.getBoundingClientRect())
    } else add(el, el.getBoundingClientRect())
  }
  // The canvas is scaled to fit, so its text shrinks with the viewport; flag what lands unreadably small.
  const MIN_TEXT_PX = 8
  const canvas = document.querySelector('[data-presentation-canvas]')
  const scale = canvas && canvas.offsetWidth ? canvas.getBoundingClientRect().width / canvas.offsetWidth : 1
  const findings = []
  for (const el of document.querySelectorAll('[data-presentation-canvas] *')) {
    const text = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
    if (!text) continue
    const range = document.createRange()
    range.selectNodeContents(text)
    const rect = range.getBoundingClientRect()
    add(el, rect)
    const size = parseFloat(getComputedStyle(el).fontSize) * scale
    if (rect.width > 0 && visible(el) && size < MIN_TEXT_PX) {
      findings.push({
        kind: 'small-text',
        key: describe(el),
        message: `${describe(el)} renders at ${size.toFixed(1)}px (under ${MIN_TEXT_PX}px) at this viewport; raise its font size or the canvas scale`,
      })
    }
  }
  const allowed = (el) => el.closest('[data-presentation-allow-overlap]') !== null
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      if (allowed(a.el) || allowed(b.el)) continue
      const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (w > 2 && h > 2) {
        findings.push({ kind: 'overlap', key: [describe(a.el), describe(b.el)].sort().join(' <-> '), message: `${describe(a.el)} overlaps ${describe(b.el)}` })
      }
    }
  }
  // Entries with text differ in size by label alone, so only empty indicators compare dimensions.
  const sig = (el) => {
    const s = getComputedStyle(el)
    const size = el.textContent.trim() ? [] : [s.width, s.height]
    return [s.color, s.backgroundColor, s.borderTopColor, s.borderTopWidth, s.opacity, s.fontWeight, s.boxShadow, s.textDecorationLine, s.outlineStyle, ...size].join('|')
  }
  for (const [selector, label] of [
    ['[data-presentation-progress-item]', 'progress indicator'],
    ['[data-presentation-toc-item]', 'table-of-contents entry'],
  ]) {
    const all = [...document.querySelectorAll(selector)]
    const active = all.find((el) => el.getAttribute('data-presentation-active') === 'true')
    const inactive = all.filter((el) => el !== active)
    if (active && inactive.length && inactive.every((el) => sig(el) === sig(active))) {
      findings.push({ kind: 'indistinct-active', key: label, message: `active ${label} is visually indistinguishable from inactive ones; style [data-presentation-active="true"]` })
    }
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    findings.push({ kind: 'attribution', key: 'missing', message: 'attribution link is missing; style it via [data-presentation-attribution]' })
  } else {
    const s = getComputedStyle(attribution)
    if (parseFloat(s.fontSize) < 11) {
      findings.push({ kind: 'attribution', key: 'small', message: `attribution is too small (${s.fontSize}); style it via [data-presentation-attribution]` })
    }
    if (s.color === 'rgb(0, 0, 238)' && s.textDecorationLine === 'underline') {
      findings.push({ kind: 'attribution', key: 'default', message: 'attribution uses the browser-default link style; style it via [data-presentation-attribution]' })
    }
  }
  return findings
}

function formatSteps(steps) {
  return steps.length === 1 ? `step ${steps[0]}` : `steps ${steps.join(', ')}`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.slug) throw new Error('usage: inspect-presentation <slug> [--out dir] [--settle ms] [--viewport WxH] [--mode browse|present] [--build|--no-build]')
  const out = args.out ?? path.join(args.root, '.inspection', args.slug)
  const needsBuild = args.build ?? !fs.existsSync(path.join(args.root, 'dist', 'index.html'))
  if (needsBuild) {
    console.log('[inspect] building')
    const result = await runBuild(args.root)
    if (result.code !== 0) throw new Error(`npm run build failed\n${result.output}`)
  }
  fs.mkdirSync(out, { recursive: true })

  const preview = await startPreview(args.root)
  let browser
  const captured = []
  const warnings = new Map()
  try {
    browser = await launchChromium({ root: args.root })
    const page = await browser.newPage({ viewport: args.viewport })
    await page.goto(`${preview.url}/${args.slug}`, { waitUntil: 'load' })
    const root = page.locator('[data-presentation-root]')
    await root.waitFor({ timeout: STEP_TIMEOUT })
    const count = Number(await root.getAttribute('data-step-count'))
    if ((await root.getAttribute('data-presentation-mode')) !== args.mode) await page.keyboard.press('p')
    for (let i = 0; i < count; i++) {
      const moved = Date.now()
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
          i,
          { timeout: STEP_TIMEOUT },
        )
      }
      await sleep(args.settle)
      const settledMs = Date.now() - moved
      const file = path.join(out, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      const id = await root.getAttribute('data-step-id')
      captured.push({ step: i + 1, id, file: path.relative(args.root, file), settledMs })
      for (const finding of await page.evaluate(diagnose)) {
        const key = `${finding.kind}:${finding.key}`
        const entry = warnings.get(key) ?? { kind: finding.kind, message: finding.message, steps: [] }
        entry.steps.push(i + 1)
        warnings.set(key, entry)
      }
    }
  } finally {
    await browser?.close()
    await preview.stop()
  }

  const list = [...warnings.values()]
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ slug: args.slug, steps: captured, warnings: list }, null, 2))
  console.log(`[inspect] ${captured.length} screenshots in ${path.relative(args.root, out) || out}`)
  for (const w of list) console.log(`WARN [${w.kind}] ${formatSteps(w.steps)}: ${w.message}`)
  console.log(list.length ? `[inspect] ${list.length} advisory warning(s)` : '[inspect] no advisory warnings')
}

main().catch((err) => {
  console.error(`[inspect] failed: ${err?.message ?? err}`)
  process.exitCode = 1
})
